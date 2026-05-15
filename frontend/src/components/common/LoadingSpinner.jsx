import { Loader } from "lucide-react";

function LoadingSpinner({ size = "medium", text = "Loading..." }) {
  const sizeClasses = {
    small: "w-6 h-6",
    medium: "w-12 h-12",
    large: "w-16 h-16"
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Loader className={`${sizeClasses[size]} text-blue-600 animate-spin mb-4`} />
      <p className="text-gray-600 text-sm">{text}</p>
    </div>
  );
}

export default LoadingSpinner;