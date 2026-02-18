import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, Fingerprint } from "lucide-react";

interface BiometricDropzoneProps {
  onDeposit: () => void;
}

const BiometricDropzone = ({ onDeposit }: BiometricDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploaded, setUploaded] = useState<string | null>(null);

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
    if (file) {
      setUploaded(file.name);
      onDeposit();
    }
  }, [onDeposit]);

  const handleClick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "text/*,video/*,image/*";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        setUploaded(file.name);
        onDeposit();
      }
    };
    input.click();
  }, [onDeposit]);

  return (
    <motion.div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`
        relative cursor-pointer glass-panel h-24 flex items-center justify-center gap-4
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

      <Fingerprint
        className={`w-8 h-8 transition-colors duration-300 ${
          isDragging ? "text-foreground" : "text-muted-foreground"
        }`}
      />
      <div>
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
    </motion.div>
  );
};

export default BiometricDropzone;
