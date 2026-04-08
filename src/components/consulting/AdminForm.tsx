import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { showSuccess, showError } from "@/utils/toast";
import { Zap } from "lucide-react";

interface AdminFormProps {
  onAdd: (record: any) => void;
  areas: string[];
  activityTypes: { value: string; label: string }[];
  isServiceOnly?: boolean;
}

export function AdminForm({ onAdd, areas, activityTypes, isServiceOnly }: AdminFormProps) {
  const getLocalDate = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const [date, setDate] = useState(getLocalDate());
  const [type, setType] = useState(activityTypes[0]?.value || '');
  const [area, setArea] = useState(areas[0] || '');
  const [hours, setHours] = useState("1");
  const [impact, setImpact] = useState("");
  const [notes, setNotes] = useState("");
  const [opportunity, setOpportunity] = useState(false);

  const handleSubmit = () => {
    if (!impact.trim()) {
      showError("Por favor, describe el impacto");
      return;
    }
    if (!date || !type || !area) {
      showError("Faltan campos obligatorios");
      return;
    }

    onAdd({
      date,
      type,
      area,
      hours: isServiceOnly ? 0 : (parseFloat(hours) || 0),
      impact,
      notes,
      opportunity
    });

    setType(activityTypes[0]?.value || '');
    setArea(areas[0] || '');
    setHours("1");
    setImpact("");
    setNotes("");
    setOpportunity(false);
    setDate(getLocalDate());
    showSuccess("Actividad registrada con éxito");
  };

  const selectClass = "flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#62BAD3] focus:border-transparent transition-all";

  return (
    <Card className="p-6 mb-8 shadow-md border-slate-100 rounded-xl bg-white">
      <h2 className="text-base font-bold mb-5 text-[#2A2B73] flex items-center gap-2">
        <Zap className="h-5 w-5 text-[#D9E021]" />
        Registrar nueva actividad
      </h2>
      <div className={`grid grid-cols-1 ${isServiceOnly ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-4 mb-4`}>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Fecha</Label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="focus-visible:ring-[#62BAD3]" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tipo</Label>
          <select className={selectClass} value={type} onChange={e => setType(e.target.value)}>
            {activityTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Área</Label>
          <select className={selectClass} value={area} onChange={e => setArea(e.target.value)}>
            {areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        {!isServiceOnly && (
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Horas</Label>
            <Input type="number" step="0.5" min="0.5" value={hours} onChange={e => setHours(e.target.value)} className="focus-visible:ring-[#62BAD3]" />
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Impacto (valor entregado)</Label>
          <Input placeholder="Ej: Diagnóstico de gaps..." value={impact} onChange={e => setImpact(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} className="focus-visible:ring-[#62BAD3]" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Notas internas</Label>
          <Input placeholder="Detalles adicionales" value={notes} onChange={e => setNotes(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} className="focus-visible:ring-[#62BAD3]" />
        </div>
      </div>
      <div className="flex items-center space-x-3 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100">
        <Checkbox id="opportunity" checked={opportunity} onCheckedChange={(c) => setOpportunity(c === true)} className="data-[state=checked]:bg-[#E32462] data-[state=checked]:border-[#E32462]" />
        <Label htmlFor="opportunity" className="text-sm font-medium cursor-pointer text-[#2A2B73]">
          Marcar como oportunidad de proyecto extra (fuera del abono)
        </Label>
      </div>
      <Button onClick={handleSubmit} className="w-full bg-[#D9E021] hover:bg-[#c6cc1b] text-[#2A2B73] font-bold text-base h-12 shadow-sm">
        Registrar actividad
      </Button>
    </Card>
  );
}