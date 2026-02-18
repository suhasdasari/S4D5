import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, Fingerprint } from "lucide-react";

interface BiometricDropzoneProps {
  onDeposit: () => void;
}

const BiometricDropzone = ({ onDeposit }: BiometricDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploaded, setUploaded] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleUpload = useCallback((file: File) => {
    setUploaded(file.name);
    setProcessing(true);
    onDeposit();
    setTimeout(() => setProcessing(false), 3000);
  }, [onDeposit]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const handleClick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "text/*,video/*,image/*";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
    };
    input.click();
  }, [handleUpload]);

  return (
    <motion.div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`
        relative cursor-pointer glass-panel h-24 flex flex-col justify-center gap-2
        transition-all duration-500 overflow-hidden
        ${isDragging ? "border-foreground/20" : ""}
      `}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent opacity-50"
          style={{ animation: "scan-line 3s linear infinite" }}
        />
      </div>

      <div className="flex items-center gap-4 px-4">
        <Fingerprint
          className={`w-8 h-8 transition-colors duration-300 ${
            isDragging ? "text-foreground" : "text-muted-foreground"
          }`}
        />
        <div className="flex-1">
          <p className="font-display text-xs tracking-[0.2em] uppercase text-foreground">
            Input Intel
          </p>
          <p className="text-[10px] text-muted-foreground mt-1 max-w-xs">
            {uploaded
              ? `✓ ${uploaded}`
              : "Feed the Agent: Upload insider news, SEC filings, or market rumors."}
          </p>
        </div>
        <Upload className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Processing progress bar */}
      {processing && (
        <div className="px-4">
          <div className="h-1 rounded-full overflow-hidden bg-foreground/5">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, ease: "linear" }}
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, hsl(0 0% 100%), hsl(0 0% 63%), hsl(0 0% 100%))",
                backgroundSize: "200% 100%",
                animation: "shimmer 1s linear infinite",
              }}
            />
          </div>
          <p className="text-[9px] text-muted-foreground mt-1 font-display tracking-wider uppercase">
            Processing Intelligence...
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default BiometricDropzone;
