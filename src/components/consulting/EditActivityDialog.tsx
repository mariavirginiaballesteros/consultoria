import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ActivityRecord } from "@/lib/consulting-data";
import { Zap } from "lucide-react";

interface EditActivityDialogProps {
  record: ActivityRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: ActivityRecord) => void;
  areas: string[];
  activityTypes: { value: string; label: string }[];
  isServiceOnly?: boolean;
}

export function EditActivityDialog({ record, isOpen, onClose, onSave, areas, activityTypes, isServiceOnly }: EditActivityDialogProps) {
  const [formData, setFormData] = useState<ActivityRecord | null>(null);

  useEffect(() => {
    if (record) setFormData({ ...record });
  }, [record]);

  if (!formData) return null;

  const selectClass = "flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#62BAD3] focus:border-transparent transition-all";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-[#2A2B73] flex items-center gap-2 text-xl font-bold">
            <Zap className="h-5 w-5 text-[#D9E021]" /> Editar Actividad
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-5 py-4">
          <div className={`grid ${isServiceOnly ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Fecha</Label>
              <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="focus-visible:ring-[#62BAD3]" />
            </div>
            {!isServiceOnly && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Horas</Label>
                <Input type="number" step="0.5" min="0.5" value={formData.hours} onChange={e => setFormData({...formData, hours: parseFloat(e.target.value) || 0})} className="focus-visible:ring-[#62BAD3]" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tipo</Label>
              <select className={selectClass} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                {activityTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Área</Label>
              <select className={selectClass} value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})}>
                {areas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Impacto (valor entregado)</Label>
            <Input value={formData.impact} onChange={e => setFormData({...formData, impact: e.target.value})} className="focus-visible:ring-[#62BAD3]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Notas internas</Label>
            <Input value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="focus-visible:ring-[#62BAD3]" />
          </div>
          <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <Checkbox id="edit-opportunity" checked={formData.opportunity} onCheckedChange={(c) => setFormData({...formData, opportunity: c === true})} className="data-[state=checked]:bg-[#E32462] data-[state=checked]:border-[#E32462]" />
            <Label htmlFor="edit-opportunity" className="text-sm font-medium cursor-pointer text-[#2A2B73]">
              Marcar como oportunidad de proyecto extra
            </Label>
          </div>
          <Button onClick={() => onSave(formData)} className="w-full mt-2 h-12 bg-[#D9E021] hover:bg-[#c6cc1b] text-[#2A2B73] font-bold text-base shadow-sm">
            Guardar cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}