import { checkUserRole } from '@/lib/auth';
import { createClient } from '@/app/utils/supabase/server';
import { notFound } from 'next/navigation';
import { resolveReportForm } from '@/app/actions/communityActions';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const dynamic = 'force-dynamic';

export default async function AdminModerationPage() {
  const isAdmin = await checkUserRole('admin');
  if (!isAdmin) notFound();

  const supabase = createClient();
  const { data: reports } = await supabase
    .from('reports')
    .select('id, entity_type, entity_id, reason, status, created_at, reporter_id')
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-amber-500">Moderação</h1>
        <p className="text-neutral-400 mt-1">Denúncias abertas. Marca como encerrada ou descartada.</p>
      </header>

      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-neutral-700">
              <TableHead className="text-white">Data</TableHead>
              <TableHead className="text-white">Tipo</TableHead>
              <TableHead className="text-white">ID</TableHead>
              <TableHead className="text-white">Motivo</TableHead>
              <TableHead className="text-white">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(reports ?? []).map((r) => (
              <TableRow key={r.id} className="border-neutral-800">
                <TableCell className="text-neutral-300 text-sm">
                  {new Date(r.created_at).toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="text-neutral-200">{r.entity_type}</TableCell>
                <TableCell className="font-mono text-xs text-neutral-400">{r.entity_id}</TableCell>
                <TableCell className="text-neutral-300 max-w-md">{r.reason}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <form action={resolveReportForm}>
                      <input type="hidden" name="report_id" value={r.id} />
                      <input type="hidden" name="status" value="closed" />
                      <Button type="submit" size="sm" className="bg-green-700 hover:bg-green-600">
                        Encerrar
                      </Button>
                    </form>
                    <form action={resolveReportForm}>
                      <input type="hidden" name="report_id" value={r.id} />
                      <input type="hidden" name="status" value="dismissed" />
                      <Button type="submit" size="sm" variant="outline" className="border-neutral-600">
                        Descartar
                      </Button>
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {(!reports || reports.length === 0) && (
        <p className="text-neutral-500 mt-6 text-sm">Nenhuma denúncia aberta.</p>
      )}
    </div>
  );
}
