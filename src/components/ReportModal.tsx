import React, { useState } from 'react';
import { X, Camera, MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReportModalProps {
  lat: number;
  lng: number;
  onClose: () => void;
  onSubmit: (report: { issue: string; photo?: File }) => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ lat, lng, onClose, onSubmit }) => {
  const [issue, setIssue] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue.trim()) return;

    setIsSubmitting(true);
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onSubmit({ issue, photo: photo || undefined });
    setIsSubmitting(false);
    setIsSuccess(true);
    
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Report Issue</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
              <X className="h-6 w-6" />
            </button>
          </div>

          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-gray-50 p-3 rounded-2xl flex items-center gap-3 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-blue-500" />
                <span>Location: {lat.toFixed(4)}, {lng.toFixed(4)}</span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">What's the issue?</label>
                <textarea
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  placeholder="e.g., No signal here, but showing 5G..."
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Add Photo (Optional)</label>
                <div className="relative">
                  {preview ? (
                    <div className="relative w-full h-40 rounded-2xl overflow-hidden group">
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setPhoto(null); setPreview(null); }}
                        className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors">
                      <Camera className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-xs text-gray-500">Tap to upload photo</span>
                      <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !issue.trim()}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Report</span>
                )}
              </button>
            </form>
          ) : (
            <div className="py-12 flex flex-col items-center gap-4 text-center">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Report Submitted!</h3>
                <p className="text-gray-500 mt-1">Thank you for helping us improve our coverage data.</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ReportModal;
