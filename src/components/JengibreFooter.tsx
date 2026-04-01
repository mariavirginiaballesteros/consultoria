import { Sparkles } from "lucide-react";

export function JengibreFooter() {
  return (
    <div className="mt-12 pb-8 flex justify-center w-full">
      <div className="bg-[#2A2B73] text-white text-xs sm:text-sm px-6 py-3 rounded-full shadow-lg flex items-center gap-3 font-medium tracking-wide border-b-4 border-[#D9E021]">
        <Sparkles className="text-[#D9E021] h-5 w-5 shrink-0" />
        <span>Servicio de calidad Jengibre. Nada de humo, pura magia que transforma.</span>
      </div>
    </div>
  );
}