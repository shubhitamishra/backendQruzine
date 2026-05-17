import React, { useState } from 'react';
import { Mail, MessageCircle, Copy, Check, X } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const ShareCredentialsModal = ({ 
  isOpen, 
  onClose, 
  restaurantData,
  onSendEmail,
  loading 
}) => {
  const [copied, setCopied] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

  if (!isOpen || !restaurantData) return null;

  const { credentials, name, contactInfo } = restaurantData;

  const handleCopyCredentials = async () => {
    const credentialsText = `Restaurant Login Credentials
Restaurant: ${name}
Admin ID: ${credentials.adminId}
Password: ${credentials.password}
Login URL: ${window.location.origin}/restaurant/login`;

    try {
      await navigator.clipboard.writeText(credentialsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleWhatsAppShare = () => {
    if (!contactInfo?.phone) {
      alert('No phone number available for this restaurant');
      return;
    }

    const message = `🏪 *Restaurant Login Credentials*

*Restaurant:* ${name}
*Admin ID:* ${credentials.adminId}
*Password:* ${credentials.password}
*Login URL:* ${window.location.origin}/restaurant/login

Please keep these credentials secure and change your password after first login.

Best regards,
Restaurant Management Team`;

    // Clean phone number (remove any non-digit characters except +)
    const cleanPhone = contactInfo.phone.replace(/[^\d+]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleSendEmail = async () => {
    if (!contactInfo?.email) {
      alert('No email address available for this restaurant');
      return;
    }

    try {
      setEmailSending(true);
      await onSendEmail(restaurantData);
      alert('Credentials sent successfully via email!');
    } catch (error) {
      alert(`Failed to send email: ${error.message}`);
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Share Restaurant Credentials</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-medium text-gray-800 mb-2">{name}</h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Admin ID:</span> {credentials.adminId}</p>
              <p><span className="font-medium">Password:</span> {credentials.password}</p>
              <p><span className="font-medium">Email:</span> {contactInfo?.email || 'Not provided'}</p>
              <p><span className="font-medium">Phone:</span> {contactInfo?.phone || 'Not provided'}</p>
            </div>
          </div>

          <div className="text-sm text-gray-600 mb-4">
            Choose how you want to share the login credentials with the restaurant owner:
          </div>

          <div className="space-y-3">
            {/* Email Option */}
            <button
              onClick={handleSendEmail}
              disabled={!contactInfo?.email || emailSending || loading}
              className="w-full flex items-center justify-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {emailSending ? (
                <LoadingSpinner size="small" />
              ) : (
                <Mail className="h-5 w-5 text-blue-600" />
              )}
              <span className="font-medium">
                {emailSending ? 'Sending Email...' : 'Send via Email'}
              </span>
              {!contactInfo?.email && (
                <span className="text-xs text-red-500">(No email provided)</span>
              )}
            </button>

            {/* WhatsApp Option */}
            <button
              onClick={handleWhatsAppShare}
              disabled={!contactInfo?.phone || loading}
              className="w-full flex items-center justify-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <MessageCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium">Share via WhatsApp</span>
              {!contactInfo?.phone && (
                <span className="text-xs text-red-500">(No phone provided)</span>
              )}
            </button>

            {/* Copy to Clipboard Option */}
            <button
              onClick={handleCopyCredentials}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {copied ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <Copy className="h-5 w-5 text-gray-600" />
              )}
              <span className="font-medium">
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </span>
            </button>
          </div>
        </div>

        <div className="flex justify-end space-x-3 border-t pt-4">
          <button
            onClick={onClose}
            disabled={loading || emailSending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareCredentialsModal;
