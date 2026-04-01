import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Pencil, Check, Users, Zap, FileText, CheckCircle2, Clock } from "lucide-react";
import { ActivityRecord } from "@/lib/consulting-data";

interface AdminTableProps {
  records: ActivityRecord[];
  onEdit: (record: ActivityRecord) => void;
  onDelete: (ids: string[]) => void;
  typeLabels: Record<string, string>;
}

export function AdminTable({ records, onEdit, onDelete, typeLabels }: AdminTableProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reunion': return <Users className="h-4 w-4 mr-2 text-[#62BAD3]" />;
      case 'trabajo': return <Zap className="h-4 w-4 mr-2 text-[#D9E021]" />;
      case 'reporte': return <FileText className="h-4 w-4 mr-2 text-[#E32462]" />;
      default: return <CheckCircle2 className="h-4 w-4 mr-2 text-slate-400" />;
    }
  };

  const toggleAll = () => {
    if (selected.length === records.length) setSelected([]);
    else setSelected(records.map(r => r.id));
  };

  const toggleOne = (id: string) => {
    if (selected.includes(id)) setSelected(selected.filter(x => x !== id));
    else setSelected([...selected, id]);
  };

  const handleBulkDelete = () => {
    onDelete(selected);
    setSelected([]);
  };

  const handleSingleDelete = (id: string) => {
    onDelete([id]);
    setSelected(selected.filter(x => x !== id));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden mb-8 shadow-sm">
      {selected.length > 0 && (
        <div className="bg-[#E32462]/10 p-3 flex justify-between items-center border-b border-[#E32462]/20 animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-bold text-[#E32462] px-2">{selected.length} seleccionados</span>
          <Button size="sm" className="bg-[#E32462] hover:bg-[#c21d51] text-white shadow-sm" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4 mr-2" /> Borrar selección
          </Button>
        </div>
      )}

      <Table>
        <TableHeader className="bg-slate-50/80">
          <TableRow>
            <TableHead className="w-[40px] px-4">
              <Checkbox 
                checked={records.length > 0 && selected.length === records.length}
                onCheckedChange={toggleAll}
                className="data-[state=checked]:bg-[#2A2B73] data-[state=checked]:border-[#2A2B73]"
              />
            </TableHead>
            <TableHead className="w-[100px] text-[#2A2B73]">Fecha</TableHead>
            <TableHead className="text-[#2A2B73]">Tipo</TableHead>
            <TableHead className="text-[#2A2B73]">Área</TableHead>
            <TableHead className="text-center text-[#2A2B73]">Hs</TableHead>
            <TableHead className="max-w-[150px] sm:max-w-[250px] text-[#2A2B73]">Impacto</TableHead>
            <TableHead className="text-center text-[#2A2B73]">No cubierto</TableHead>
            <TableHead className="text-right text-[#2A2B73]">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-slate-500 py-10">
                No hay actividades registradas en este periodo.
              </TableCell>
            </TableRow>
          ) : (
            records.map((r) => (
              <TableRow key={r.id} className={`hover:bg-slate-50/50 ${selected.includes(r.id) ? 'bg-slate-50' : ''}`}>
                <TableCell className="px-4">
                  <Checkbox 
                    checked={selected.includes(r.id)}
                    onCheckedChange={() => toggleOne(r.id)}
                    className="data-[state=checked]:bg-[#2A2B73] data-[state=checked]:border-[#2A2B73]"
                  />
                </TableCell>
                <TableCell className="font-medium text-xs text-slate-600">{r.date}</TableCell>
                <TableCell className="text-xs whitespace-nowrap">
                  <div className="flex items-center font-medium text-slate-700">
                    {getTypeIcon(r.type)}
                    {typeLabels[r.type] || r.type}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-slate-600">{r.area}</TableCell>
                <TableCell className="text-center font-bold text-xs text-[#2A2B73]">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" /> {r.hours}h
                  </div>
                </TableCell>
                <TableCell className="text-xs max-w-[150px] sm:max-w-[250px] truncate text-slate-600" title={r.impact}>{r.impact}</TableCell>
                <TableCell className="text-center">
                  {r.opportunity && <Check className="h-5 w-5 mx-auto text-[#E32462]" strokeWidth={3} />}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#62BAD3] hover:bg-[#62BAD3]/10" onClick={() => onEdit(r)} title="Editar actividad">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#E32462] hover:bg-[#E32462]/10" onClick={() => handleSingleDelete(r.id)} title="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}