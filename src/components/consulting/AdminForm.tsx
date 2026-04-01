import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ActivityType, AREAS } from "@/lib/consulting-data";
import { showSuccess, showError } from "@/utils/toast";

interface AdminFormProps {
  onAdd: (record: any) => void;
}

export function AdminForm({ onAdd }: AdminFormProps) {
  // Función para obtener la fecha local correcta evitando desfases de UTC
  const getLocalDate = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const [date, setDate] = useState(getLocalDate());
  const [type, setType] = useState<ActivityType>('reunion');
  const [area, setArea] = useState(AREAS[0]);
  const [hours, setHours] = useState("1");
  const [impact, setImpact] = useState("");
  const [notes, setNotes] = useState("");
  const [opportunity, setOpportunity] = useState(false);

  const handleSubmit = () => {
    if (!impact.trim()) {
      showError("Por favor, describe el impacto");
      return;
    }
    if (!date) {
      showError("Por favor, selecciona una fecha");
      return;
    }

    onAdd({
      date,
      type,
      area,
      hours: parseFloat(hours) || 0,
      impact,
      notes,
      opportunity
    });

    // Resetear formulario
    setType('reunion');
    setArea(AREAS[0]);
    setHours("1");
    setImpact("");
    setNotes("");
    setOpportunity(false);
    setDate(getLocalDate());
    showSuccess("Actividad registrada con éxito");
  };

  const selectClass = "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Card className="p-5 mb-8 shadow-sm">
      <h2 className="text-sm font-semibold mb-4 text-slate-900">Registrar actividad</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Fecha</Label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tipo</Label>
          <select className={selectClass} value={type} onChange={e => setType(e.target.value as ActivityType)}>
            <option value="reunion">Reunión</option>
            <option value="trabajo">Trabajo/Análisis</option>
            <option value="reporte">Reporte</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Área</Label>
          <select className={selectClass} value={area} onChange={e => setArea(e.target.value)}>
            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Horas</Label>
          <Input type="number" step="0.5" min="0.5" value={hours} onChange={e => setHours(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Impacto (describe el valor entregado)</Label>
          <Input placeholder="Ej: Diagnóstico de gaps..." value={impact} onChange={e => setImpact(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Notas</Label>
          <Input placeholder="Detalles adicionales" value={notes} onChange={e => setNotes(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>
      </div>
      <div className="flex items-center space-x-2 mb-4">
        <Checkbox id="opportunity" checked={opportunity} onCheckedChange={(c) => setOpportunity(c === true)} />
        <Label htmlFor="opportunity" className="text-xs cursor-pointer">Marcar como oportunidad NO cubierta en 20hs</Label>
      </div>
      <Button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
        ➕ Registrar actividad
      </Button>
    </Card>
  );
}