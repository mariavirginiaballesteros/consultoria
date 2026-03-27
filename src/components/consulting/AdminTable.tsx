import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Check } from "lucide-react";
import { ActivityRecord, TYPE_LABELS } from "@/lib/consulting-data";

interface AdminTableProps {
  records: ActivityRecord[];
  onDelete: (id: number) => void;
}

export function AdminTable({ records, onDelete }: AdminTableProps) {
  return (
    <div className="rounded-md border bg-white overflow-hidden mb-8 shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50/80">
          <TableRow>
            <TableHead className="w-[100px]">Fecha</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Área</TableHead>
            <TableHead className="text-center">Hs</TableHead>
            <TableHead className="max-w-[200px]">Impacto</TableHead>
            <TableHead className="text-center">No cubierto</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No hay actividades registradas.
              </TableCell>
            </TableRow>
          ) : (
            records.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium text-xs">{r.date}</TableCell>
                <TableCell className="text-xs whitespace-nowrap">{TYPE_LABELS[r.type]}</TableCell>
                <TableCell className="text-xs">{r.area}</TableCell>
                <TableCell className="text-center font-semibold text-xs">{r.hours}h</TableCell>
                <TableCell className="text-xs truncate max-w-[200px]" title={r.impact}>{r.impact}</TableCell>
                <TableCell className="text-center">
                  {r.opportunity && <Check className="h-4 w-4 mx-auto text-amber-600" />}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50" onClick={() => onDelete(r.id)}>
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