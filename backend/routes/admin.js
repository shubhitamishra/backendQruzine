const express = require("express")
const { body, validationResult } = require("express-validator")
const Restaurant = require("../models/Restaurant")
const Order = require("../models/Order")
const User = require("../models/User")
const MenuItem = require("../models/Menu")
const QRCode = require("../models/QRCode")
const { authenticateSuperAdmin } = require("../middleware/auth")
const { generateResID, generatePassword, hashPassword } = require("../utils/helpers")
const { sendRestaurantCredentials } = require("../utils/emailService")
const { restaurantValidation } = require("../utils/validation")
const createCsvWriter = require("csv-writer").createObjectCsvWriter

const router = express.Router()
const os = require('os')
const path = require('path')

// Get all restaurants
router.get("/restaurants", authenticateSuperAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", businessType = "" } = req.query

    // Build search query
    const query = {}
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { resID: { $regex: search, $options: "i" } },
      ]
    }
    if (businessType) {
      query.businessType = businessType
    }

    const restaurants = await Restaurant.find(query)
      .select("-credentials.password") // Don't send password in response
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Restaurant.countDocuments(query)

    // Get statistics for each restaurant
    const restaurantsWithStats = await Promise.all(
      restaurants.map(async (restaurant) => {
        const totalOrders = await Order.countDocuments({ resID: restaurant.resID })
        const todayOrders = await Order.countDocuments({
          resID: restaurant.resID,
          createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        })
        const totalMenuItems = await MenuItem.countDocuments({ resID: restaurant.resID })
        const totalQRCodes = await QRCode.countDocuments({ resID: restaurant.resID })

        return {
          ...restaurant.toObject(),
          stats: {
            totalOrders,
            todayOrders,
            totalMenuItems,
            totalQRCodes,
          },
        }
      }),
    )

    res.json({
      success: true,
      data: restaurantsWithStats,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: Number.parseInt(limit),
      },
    })
  } catch (error) {
    console.error("Get restaurants error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Get single restaurant details
router.get("/restaurants/:resID", authenticateSuperAdmin, async (req, res) => {
  try {
    const { resID } = req.params

    const restaurant = await Restaurant.findOne({ resID }).select("-credentials.password")

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      })
    }

    // Get detailed statistics
    const totalOrders = await Order.countDocuments({ resID })
    const todayOrders = await Order.countDocuments({
      resID,
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    })
    const totalRevenue = await Order.aggregate([
      { $match: { resID, status: "Delivered" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ])
    const totalMenuItems = await MenuItem.countDocuments({ resID })
    const totalQRCodes = await QRCode.countDocuments({ resID })
    const totalCustomers = await User.countDocuments({ resID })

    // Recent orders
    const recentOrders = await Order.find({ resID })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("orderID customer.name totalAmount status createdAt")

    res.json({
      success: true,
      data: {
        ...restaurant.toObject(),
        stats: {
          totalOrders,
          todayOrders,
          totalRevenue: totalRevenue[0]?.total || 0,
          totalMenuItems,
          totalQRCodes,
          totalCustomers,
        },
        recentOrders,
      },
    })
  } catch (error) {
    console.error("Get restaurant details error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Add new restaurant
router.post("/restaurants", authenticateSuperAdmin, restaurantValidation, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const { name, location, businessType, gstNumber, contactInfo } = req.body

    // Generate unique restaurant ID and credentials
    const resID = generateResID()
    const adminId = `admin_${resID.toLowerCase()}`
    const password = generatePassword(10)
    const hashedPassword = await hashPassword(password)

    // Create restaurant with updated location structure
    const restaurant = new Restaurant({
      resID,
      name,
      location: {
        address: location.address,
        state: location.state,
        city: location.city,
        area: location.area,
        pincode: location.pincode,
      },
      businessType,
      gstNumber: gstNumber.toUpperCase(), // Ensure GST is stored in uppercase
      contactInfo,
      credentials: {
        adminId,
        password: hashedPassword,
      },
    })

    await restaurant.save()

    // Send credentials email if email is provided (non-blocking)
    if (contactInfo?.email) {
      setImmediate(async () => {
        try {
          await sendRestaurantCredentials(restaurant, { adminId, password })
        } catch (e) {
          console.warn("[Email] Failed to send credentials email (non-blocking):", e?.message || e)
        }
      })
    }

    res.status(201).json({
      success: true,
      message: "Restaurant created successfully",
      data: {
        resID: restaurant.resID,
        name: restaurant.name,
        location: restaurant.location,
        businessType: restaurant.businessType,
        gstNumber: restaurant.gstNumber,
        credentials: {
          adminId,
          password, // Send plain password only once during creation
        },
      },
    })
  } catch (error) {
    console.error("Create restaurant error:", error)
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: "Restaurant with this ID or GST number already exists",
      })
    } else if (error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map(err => err.message),
      })
    } else {
      res.status(500).json({
        success: false,
        message: "Internal server error",
      })
    }
  }
})

const locationData = {
  states: [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry", "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep", "Andaman and Nicobar Islands"
  ],
  
  cities: {
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati", "Kadapa", "Anantapur", "Eluru"],
    "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tezpur", "Bomdila", "Ziro", "Along", "Tezu", "Roing", "Changlang"],
    "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon", "Karimganj", "Sivasagar"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif", "Arrah", "Begusarai", "Katihar"],
    "Chhattisgarh": ["Raipur", "Bhilai", "Korba", "Bilaspur", "Durg", "Rajnandgaon", "Jagdalpur", "Raigarh", "Ambikapur", "Dhamtari"],
    "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Bicholim", "Curchorem", "Sanquelim", "Cuncolim", "Quepem"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Navsari"],
    "Haryana": ["Faridabad", "Gurgaon", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula"],
    "Himachal Pradesh": ["Shimla", "Dharamshala", "Solan", "Mandi", "Palampur", "Una", "Kullu", "Hamirpur", "Bilaspur", "Chamba"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Phusro", "Hazaribagh", "Giridih", "Ramgarh", "Medininagar"],
    "Karnataka": ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum", "Gulbarga", "Davanagere", "Bellary", "Bijapur", "Shimoga"],
    "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kollam", "Palakkad", "Alappuzha", "Malappuram", "Kannur", "Kasaragod"],
    "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Amravati", "Kolhapur", "Sangli", "Malegaon"],
    "Manipur": ["Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Senapati", "Ukhrul", "Tamenglong", "Chandel", "Jiribam", "Kakching"],
    "Meghalaya": ["Shillong", "Tura", "Jowai", "Nongpoh", "Baghmara", "Ampati", "Resubelpara", "Mawkyrwat", "Nongstoin", "Williamnagar"],
    "Mizoram": ["Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib", "Serchhip", "Lawngtlai", "Mamit", "Bairabi", "Vairengte"],
    "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Mon", "Zunheboto", "Phek", "Kiphire", "Longleng"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Firozpur", "Batala", "Pathankot", "Moga"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Bharatpur", "Sikar"],
    "Sikkim": ["Gangtok", "Namchi", "Gyalshing", "Mangan", "Jorethang", "Nayabazar", "Rangpo", "Singtam", "Pakyong", "Ravangla"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur", "Vellore", "Erode", "Thoothukudi"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam", "Mahbubnagar", "Nalgonda", "Adilabad", "Miryalaguda"],
    "Tripura": ["Agartala", "Dharmanagar", "Udaipur", "Kailasahar", "Belonia", "Khowai", "Amarpur", "Teliamura", "Sabroom", "Kumarghat"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Meerut", "Varanasi", "Allahabad", "Bareilly", "Moradabad", "Aligarh"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Kashipur", "Rishikesh", "Kotdwar", "Pithoragarh", "Almora"],
    "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Malda", "Baharampur", "Habra", "Kharagpur"],
    "Delhi": ["New Delhi", "Central Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", "North West Delhi", "North East Delhi", "South West Delhi", "Shahdara"],
    "Jammu and Kashmir": ["Srinagar", "Jammu", "Baramulla", "Anantnag", "Kupwara", "Pulwama", "Rajouri", "Kathua", "Udhampur", "Poonch"],
    "Ladakh": ["Leh", "Kargil", "Nubra", "Zanskar", "Changthang", "Drass", "Sankoo", "Turtuk", "Diskit", "Padum"],
    "Puducherry": ["Puducherry", "Karaikal", "Mahe", "Yanam", "Villianur", "Ariyankuppam", "Mannadipet", "Bahour", "Nettapakkam", "Kirumampakkam"],
    "Chandigarh": ["Chandigarh", "Sector 17", "Sector 22", "Sector 34", "Sector 35", "Mani Majra", "Panchkula", "Mohali"],
    "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Diu", "Silvassa", "Vapi", "Naroli", "Khanvel", "Samarvarni", "Dudhani", "Kilvani", "Rakholi"],
    "Lakshadweep": ["Kavaratti", "Agatti", "Minicoy", "Amini", "Andrott", "Kalpeni", "Kadmat", "Kiltan", "Chetlat", "Bitra"],
    "Andaman and Nicobar Islands": ["Port Blair", "Diglipur", "Mayabunder", "Rangat", "Havelock", "Neil Island", "Car Nicobar", "Bamboo Flat", "Garacharma", "Ferrargunj"]
  },
  
  areas: {
    // Mumbai Areas
    "Mumbai": ["Andheri", "Bandra", "Borivali", "Dadar", "Ghatkopar", "Juhu", "Lower Parel", "Malad", "Powai", "Versova", "Worli", "Colaba", "Fort", "Churchgate", "Marine Drive", "Linking Road", "Lokhandwala", "Kandivali", "Goregaon", "Santacruz"],
    
    // Delhi Areas
    "Delhi": ["Connaught Place", "Karol Bagh", "Lajpat Nagar", "Khan Market", "Saket", "Vasant Kunj", "Rohini", "Dwarka", "Janakpuri", "Laxmi Nagar", "Rajouri Garden", "Nehru Place", "Greater Kailash", "Defence Colony", "Hauz Khas", "Chandni Chowk", "Paharganj", "Mayur Vihar", "Preet Vihar", "Pitampura"],
    
    // Bangalore Areas
    "Bangalore": ["Koramangala", "Indiranagar", "Whitefield", "Electronic City", "HSR Layout", "BTM Layout", "Jayanagar", "Malleshwaram", "Rajajinagar", "Hebbal", "Marathahalli", "Bellandur", "Sarjapur", "Banashankari", "JP Nagar", "Yelahanka", "Frazer Town", "Commercial Street", "Brigade Road", "MG Road"],
    
    // Chennai Areas
    "Chennai": ["T Nagar", "Anna Nagar", "Adyar", "Velachery", "Tambaram", "Chrompet", "Porur", "OMR", "ECR", "Mylapore", "Nungambakkam", "Express Avenue", "Phoenix MarketCity", "Guindy", "Sholinganallur", "Perungudi", "Thiruvanmiyur", "Besant Nagar", "Alwarpet", "Egmore"],
    
    // Pune Areas
    "Pune": ["Koregaon Park", "Baner", "Wakad", "Hinjewadi", "Magarpatta", "Kharadi", "Wagholi", "Pimpri", "Chinchwad", "Aundh", "Viman Nagar", "Hadapsar", "Katraj", "Warje", "Bavdhan", "Pashan", "Sus", "Ravet", "Akurdi", "Nigdi"],
    
    // Hyderabad Areas
    "Hyderabad": ["Banjara Hills", "Jubilee Hills", "Hitech City", "Gachibowli", "Madhapur", "Kondapur", "Miyapur", "Kukatpally", "Ameerpet", "Begumpet", "Secunderabad", "Uppal", "LB Nagar", "Dilsukhnagar", "Mehdipatnam", "Tolichowki", "Manikonda", "Financial District", "Shamshabad", "Kompally"],
    
    // Kolkata Areas
    "Kolkata": ["Salt Lake", "New Town", "Park Street", "Esplanade", "Howrah", "Ballygunge", "Alipore", "Tollygunge", "Jadavpur", "Rajarhat", "Dumdum", "Barasat", "Garia", "Behala", "Kasba", "Lake Gardens", "Southern Avenue", "Gariahat", "Rashbehari", "Shyambazar"],
    
    // Ahmedabad Areas
    "Ahmedabad": ["Satellite", "Vastrapur", "Bodakdev", "Prahlad Nagar", "Thaltej", "SG Highway", "CG Road", "Navrangpura", "Ellis Bridge", "Ashram Road", "Maninagar", "Naroda", "Bopal", "Gota", "Chandkheda", "Sabarmati", "Paldi", "Gurukul", "Drive In Road", "Law Garden"],
    
    // Gurgaon Areas
    "Gurgaon": ["DLF Phase 1", "DLF Phase 2", "DLF Phase 3", "DLF Phase 4", "DLF Phase 5", "Sector 14", "Sector 15", "Sector 29", "Sector 32", "Sector 54", "Golf Course Road", "MG Road", "Sohna Road", "NH8", "Udyog Vihar", "Cyber City", "Huda City Centre", "New Gurgaon", "Palam Vihar", "South City"],
    
    // Additional major city areas
    "Kochi": ["Marine Drive", "Fort Kochi", "Mattancherry", "Edapally", "Kakkanad", "Palarivattom", "Vyttila", "Ernakulam", "Vytila", "Aluva"],
    "Jaipur": ["C Scheme", "MI Road", "Malviya Nagar", "Vaishali Nagar", "Mansarovar", "Jagatpura", "Tonk Road", "Ajmer Road", "JLN Marg", "Bani Park"],
    "Lucknow": ["Hazratganj", "Gomti Nagar", "Aliganj", "Indira Nagar", "Mahanagar", "Jankipuram", "Rajajipuram", "Aminabad", "Chowk", "Alambagh"],
    "Kanpur": ["Civil Lines", "Mall Road", "Swaroop Nagar", "Kakadeo", "Kalyanpur", "Govind Nagar", "Harsh Nagar", "Barra", "Kidwai Nagar", "Nawabganj"],
    "Nagpur": ["Sitabuldi", "Sadar", "Dharampeth", "Civil Lines", "Ramdaspeth", "Mahal", "Gandhibagh", "Bajaj Nagar", "Pratap Nagar", "Hingna"],
    "Indore": ["Vijay Nagar", "Sapna Sangeeta", "New Palasia", "MG Road", "Rajwada", "Sarafa", "Chappan Dukan", "AB Road", "Ring Road", "Scheme 78"],
    "Bhopal": ["MP Nagar", "Arera Colony", "New Market", "Bittan Market", "Kolar Road", "Berasia Road", "Hoshangabad Road", "BHEL", "Bairagarh", "Shahpura"],
    "Visakhapatnam": ["RK Beach", "MVP Colony", "Siripuram", "Dwaraka Nagar", "Gajuwaka", "Madhurawada", "Rushikonda", "Vizag Steel Plant", "PM Palem", "Akkayyapalem"],
    "Coimbatore": ["RS Puram", "Gandhipuram", "Peelamedu", "Saibaba Colony", "Race Course", "Singanallur", "Vadavalli", "Kuniamuthur", "Thudiyalur", "Saravanampatty"],
    "Vadodara": ["Alkapuri", "Fatehgunj", "Sayajigunj", "Karelibaug", "Manjalpur", "Gotri", "Vasna", "Old Padra Road", "New VIP Road", "Nizampura"],
    "Agra": ["Taj Ganj", "Sadar Bazaar", "Civil Lines", "Dayalbagh", "Sikandra", "Kamla Nagar", "Loha Mandi", "Shah Ganj", "Sanjay Place", "Agra Cantt"],
    "Nashik": ["College Road", "Gangapur Road", "Panchavati", "Canada Corner", "Adgaon", "Pathardi Phata", "Satpur", "MIDC", "Govind Nagar", "Ashok Stambh"],
    "Faridabad": ["Sector 15", "Sector 16", "Sector 21", "NIT", "Old Faridabad", "Neelam Chowk", "Ballabhgarh", "Nehru Ground", "Railway Road", "Ajronda Chowk"],
    "Meerut": ["Civil Lines", "Sadar Bazaar", "Shastri Nagar", "Brahmpuri", "Kanker Khera", "Lalkurti", "Delhi Road", "Hapur Road", "Garh Road", "Partapur"],
    "Rajkot": ["University Road", "Kalawad Road", "150 Feet Ring Road", "Mavdi", "Morbi Road", "Rajkot Airport", "Bhaktinagar", "Raiya Road", "Yagnik Road", "Gondal Road"],
    "Varanasi": ["Cantonment", "Lanka", "Assi", "Godowlia", "Lahurabir", "Sigra", "Mahmoorganj", "Bhelupur", "Nadesar", "Ramnagar"]
  }
}

// API endpoints for dropdown data
router.get("/location/states", (req, res) => {
  res.json({
    success: true,
    data: locationData.states
  })
})

router.get("/location/cities/:state", (req, res) => {
  const { state } = req.params
  const cities = locationData.cities[state] || []
  res.json({
    success: true,
    data: cities
  })
})

router.get("/location/areas/:city", (req, res) => {
  const { city } = req.params
  const areas = locationData.areas[city] || []
  res.json({
    success: true,
    data: areas
  })
})

// Update restaurant
router.put("/restaurants/:resID", authenticateSuperAdmin, restaurantValidation, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const { resID } = req.params
    const updateData = req.body

    // Remove credentials from update data (should be updated separately)
    delete updateData.credentials
    delete updateData.resID
    
    const restaurant = await Restaurant.findOneAndUpdate({ resID }, updateData, {
      new: true,
      runValidators: true,
    }).select("-credentials.password")

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      })
    }

    res.json({
      success: true,
      message: "Restaurant updated successfully",
      data: restaurant,
    })
  } catch (error) {
    console.error("Update restaurant error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Reset restaurant credentials
router.post("/restaurants/:resID/reset-credentials", authenticateSuperAdmin, async (req, res) => {
  try {
    const { resID } = req.params

    const restaurant = await Restaurant.findOne({ resID })

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      })
    }

    // Generate new credentials
    const newPassword = generatePassword(10)
    const hashedPassword = await hashPassword(newPassword)

    restaurant.credentials.password = hashedPassword
    await restaurant.save()

    // Send new credentials email if email is provided (non-blocking)
    if (restaurant.contactInfo?.email) {
      setImmediate(async () => {
        try {
          await sendRestaurantCredentials(restaurant, {
            adminId: restaurant.credentials.adminId,
            password: newPassword,
          })
        } catch (e) {
          console.warn("[Email] Failed to send reset credentials email (non-blocking):", e?.message || e)
        }
      })
    }

    res.json({
      success: true,
      message: "Credentials reset successfully",
      data: {
        adminId: restaurant.credentials.adminId,
        password: newPassword,
      },
    })
  } catch (error) {
    console.error("Reset credentials error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Toggle restaurant status (activate/deactivate)
router.patch("/restaurants/:resID/toggle-status", authenticateSuperAdmin, async (req, res) => {
  try {
    const { resID } = req.params

    const restaurant = await Restaurant.findOne({ resID })

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      })
    }

    restaurant.isActive = !restaurant.isActive
    await restaurant.save()

    res.json({
      success: true,
      message: `Restaurant ${restaurant.isActive ? "activated" : "deactivated"} successfully`,
      data: {
        resID: restaurant.resID,
        isActive: restaurant.isActive,
      },
    })
  } catch (error) {
    console.error("Toggle restaurant status error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Delete restaurant
router.delete("/restaurants/:resID", authenticateSuperAdmin, async (req, res) => {
  try {
    const { resID } = req.params

    const restaurant = await Restaurant.findOne({ resID })

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      })
    }

    // Delete all related data
    await Promise.all([
      Restaurant.deleteOne({ resID }),
      MenuItem.deleteMany({ resID }),
      QRCode.deleteMany({ resID }),
      Order.deleteMany({ resID }),
      User.deleteMany({ resID }),
    ])

    res.json({
      success: true,
      message: "Restaurant and all related data deleted successfully",
    })
  } catch (error) {
    console.error("Delete restaurant error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Export restaurant user data
router.get("/restaurants/:resID/export", authenticateSuperAdmin, async (req, res) => {
  try {
    const { resID } = req.params
    const { format = "csv" } = req.query

    const restaurant = await Restaurant.findOne({ resID })

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      })
    }

    // Get user data including optional age and dob
    const users = await User.find({ resID }).select("name phone email age dob location orderCount lastOrderDate")

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No user data found for this restaurant",
      })
    }

    if (format === "csv") {
      // Create CSV
      const csvWriter = createCsvWriter({
        path: path.join(os.tmpdir(), `restaurant_${resID}_users.csv`),
        header: [
          { id: "name", title: "Name" },
          { id: "phone", title: "Phone Number" },
          { id: "email", title: "Email" },
          { id: "age", title: "Age" },
          { id: "dob", title: "Date of Birth" },
          { id: "location", title: "Location" },
          { id: "orderCount", title: "Total Orders" },
          { id: "lastOrderDate", title: "Last Order Date" },
        ],
      })

      // Map users to plain objects and light date formatting for dob/lastOrderDate
      const rows = users.map(u => ({
        name: u.name,
        phone: u.phone,
        email: u.email,
        age: u.age ?? "",
        dob: u.dob ? new Date(u.dob).toLocaleDateString() : "",
        location: u.location,
        orderCount: u.orderCount,
        lastOrderDate: u.lastOrderDate ? new Date(u.lastOrderDate).toLocaleDateString() : "",
      }))

      await csvWriter.writeRecords(rows)

      const csvPath = path.join(os.tmpdir(), `restaurant_${resID}_users.csv`)
      res.download(csvPath, `${restaurant.name}_users.csv`, (err) => {
        if (err) {
          console.error("Download error:", err)
          res.status(500).json({
            success: false,
            message: "Error downloading file",
          })
        }
      })
    } else {
      // Return JSON
      res.json({
        success: true,
        data: {
          restaurant: {
            resID: restaurant.resID,
            name: restaurant.name,
            location: restaurant.location,
          },
          users,
          exportDate: new Date().toISOString(),
          totalUsers: users.length,
        },
      })
    }
  } catch (error) {
    console.error("Export user data error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Create coupon
router.post("/coupons", authenticateSuperAdmin, async (req, res) => {
  try {
    const { code, discount, validityDays, restaurant } = req.body;

    if (!code || !discount) {
      return res.status(400).json({
        success: false,
        message: "Code and discount are required",
      });
    }

    // Create coupon logic here - you'll need to implement a Coupon model
    // For now, returning success response
    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: {
        code,
        discount,
        validityDays,
        restaurant: restaurant || "all",
        createdAt: new Date()
      },
    });
  } catch (error) {
    console.error("Create coupon error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get bug reports
router.get("/bugs", authenticateSuperAdmin, async (req, res) => {
  try {
    // Mock bug reports data - you'll need to implement a Bug model
    const bugs = [
      {
        id: "bug1",
        restaurant: "Sample Restaurant",
        issue: "Payment gateway not working",
        status: "pending",
        date: new Date().toLocaleDateString(),
      },
      {
        id: "bug2",
        restaurant: "Another Restaurant",
        issue: "Menu items not loading",
        status: "resolved",
        date: new Date().toLocaleDateString(),
      },
    ];

    res.json({
      success: true,
      data: bugs,
    });
  } catch (error) {
    console.error("Get bugs error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Update bug status
router.patch("/bugs/:bugId", authenticateSuperAdmin, async (req, res) => {
  try {
    const { bugId } = req.params;
    const { status } = req.body;

    // Update bug status logic here - you'll need to implement a Bug model
    // For now, returning success response
    res.json({
      success: true,
      message: "Bug status updated successfully",
      data: {
        id: bugId,
        status,
        updatedAt: new Date()
      },
    });
  } catch (error) {
    console.error("Update bug status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Send restaurant credentials via email
router.post("/send-credentials", authenticateSuperAdmin, async (req, res) => {
  try {
    const { restaurantData } = req.body;

    if (!restaurantData || !restaurantData.contactInfo?.email) {
      return res.status(400).json({
        success: false,
        message: "Restaurant data or email is missing",
      });
    }

    // Queue email sending (non-blocking)
    setImmediate(async () => {
      try {
        const result = await sendRestaurantCredentials(restaurantData, restaurantData.credentials);
        if (!result.success) {
          console.warn("[Email] send-credentials failed:", result.error);
        }
      } catch (e) {
        console.warn("[Email] send-credentials error:", e?.message || e);
      }
    });

    // Respond immediately to avoid frontend timeouts if SMTP is slow/unavailable
    res.status(202).json({
      success: true,
      message: "Credentials email queued for sending",
    });
  } catch (error) {
    console.error("Send credentials error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get dashboard statistics
router.get("/dashboard/stats", authenticateSuperAdmin, async (req, res) => {
  try {
    const totalRestaurants = await Restaurant.countDocuments()
    const activeRestaurants = await Restaurant.countDocuments({ isActive: true })
    const totalOrders = await Order.countDocuments()
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    })

    // Revenue statistics
    const totalRevenue = await Order.aggregate([
      { $match: { status: "Delivered" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ])

    const todayRevenue = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
          createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ])

    // Top restaurants by orders
    const topRestaurants = await Order.aggregate([
      { $group: { _id: "$resID", orderCount: { $sum: 1 } } },
      { $sort: { orderCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "restaurants",
          localField: "_id",
          foreignField: "resID",
          as: "restaurant",
        },
      },
      { $unwind: "$restaurant" },
      {
        $project: {
          resID: "$_id",
          name: "$restaurant.name",
          orderCount: 1,
        },
      },
    ])

    res.json({
      success: true,
      data: {
        restaurants: {
          total: totalRestaurants,
          active: activeRestaurants,
          inactive: totalRestaurants - activeRestaurants,
        },
        orders: {
          total: totalOrders,
          today: todayOrders,
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          today: todayRevenue[0]?.total || 0,
        },
        topRestaurants,
      },
    })
  } catch (error) {
    console.error("Get dashboard stats error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

module.exports = router
