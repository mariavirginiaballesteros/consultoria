import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Check, Users, Zap, FileText } from "lucide-react";
import { ActivityRecord, TYPE_LABELS } from "@/lib/consulting-data";

interface AdminTableProps {
  records: ActivityRecord[];
  onDelete: (id: string) => void;
}

export function AdminTable({ records, onDelete }: AdminTableProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reunion': return <Users className="h-4 w-4 mr-2 text-[#62BAD3]" />;
      case 'trabajo': return <Zap className="h-4 w-4 mr-2 text-[#D9E021]" />;
      case 'reporte': return <FileText className="h-4 w-4 mr-2 text-[#E32462]" />;
      default: return null;
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden mb-8 shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50/80">
          <TableRow>
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
              <TableCell colSpan={7} className="text-center text-slate-500 py-10">
                No hay actividades registradas.
              </TableCell>
            </TableRow>
          ) : (
            records.map((r) => (
              <TableRow key={r.id} className="hover:bg-slate-50/50">
                <TableCell className="font-medium text-xs text-slate-600">{r.date}</TableCell>
                <TableCell className="text-xs whitespace-nowrap">
                  <div className="flex items-center font-medium text-slate-700">
                    {getTypeIcon(r.type)}
                    {TYPE_LABELS[r.type]}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-slate-600">{r.area}</TableCell>
                <TableCell className="text-center font-bold text-xs text-[#2A2B73]">{r.hours}h</TableCell>
                <TableCell className="text-xs max-w-[150px] sm:max-w-[250px] truncate text-slate-600" title={r.impact}>{r.impact}</TableCell>
                <TableCell className="text-center">
                  {r.opportunity && <Check className="h-5 w-5 mx-auto text-[#E32462]" strokeWidth={3} />}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#E32462] hover:bg-[#E32462]/10" onClick={() => onDelete(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}