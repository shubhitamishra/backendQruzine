"use client";
import React, { useEffect, useState } from "react";
import apiService from "./ApiService";

export default function BannerManager() {
  const [bannerPlacement, setBannerPlacement] = useState("all");
  const [currentBanner, setCurrentBanner] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerActive, setBannerActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const banner = await apiService.getBanner(bannerPlacement);
        setCurrentBanner(banner);
      } catch (_) {
        setCurrentBanner(null);
      }
    })();
  }, [bannerPlacement]);

  const handleUpload = async () => {
    setMessage(null);
    if (!bannerFile) {
      setMessage({ type: "warning", text: "Please choose an image or video file." });
      return;
    }
    try {
      setUploading(true);
      await apiService.uploadBanner({
        file: bannerFile,
        placement: bannerPlacement,
        isActive: bannerActive,
        title: bannerTitle,
      });
      setMessage({ type: "success", text: "Banner uploaded successfully." });
      const banner = await apiService.getBanner(bannerPlacement);
      setCurrentBanner(banner);
      setBannerFile(null);
    } catch (e) {
      setMessage({ type: "error", text: e?.message || "Failed to upload banner" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-6 md:mt-8 bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Global Banner</h2>
      <p className="text-sm text-gray-600 mb-4">
        Upload an advertisement banner (image or video). It will be shown on Menu, Cart, and Checkout screens depending on the selected placement.
      </p>

      {message && (
        <div
          className={`mb-4 rounded-md p-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : message.type === "error"
              ? "bg-red-50 text-red-800 border border-red-200"
              : "bg-yellow-50 text-yellow-800 border border-yellow-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Placement</label>
            <select
              value={bannerPlacement}
              onChange={(e) => setBannerPlacement(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">All Screens</option>
              <option value="menu">Menu</option>
              <option value="cart">Cart</option>
              <option value="checkout">Checkout</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
            <input
              type="text"
              value={bannerTitle}
              onChange={(e) => setBannerTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="e.g., Festive Offer"
            />
          </div>

          <div className="flex items-center gap-2">
            <input id="bannerActive" type="checkbox" checked={bannerActive} onChange={(e) => setBannerActive(e.target.checked)} />
            <label htmlFor="bannerActive" className="text-sm text-gray-700">Active</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Choose file (image/video)</label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Recommended sizes:
              <br />
              - Desktop: 1600 x 400 (4:1) for wide hero-style banners
              <br />
              - Mobile: 1200 x 600 (2:1)
              <br />
              - Video: MP4/WebM under 15 seconds, optimized bitrate
            </p>
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-4 py-2 rounded-lg"
          >
            {uploading ? "Uploading..." : "Upload Banner"}
          </button>
        </div>

        {/* Current banner preview */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Current banner preview</label>
          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            {!currentBanner ? (
              <div className="text-sm text-gray-500">No banner uploaded for this placement.</div>
            ) : currentBanner.type === "video" ? (
              <video src={currentBanner.url} className="w-full h-40 md:h-48 object-cover rounded" controls />
            ) : (
              <img src={currentBanner.url} alt={currentBanner.title || "Banner"} className="w-full h-40 md:h-48 object-cover rounded" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
