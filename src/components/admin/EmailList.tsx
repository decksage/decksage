'use client';

import { useState } from 'react';
import { deleteBroadcast } from '@/app/actions/emailActions';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FileEdit, Trash2, Send, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EmailListProps {
  broadcasts: any[];
  onEdit: (broadcast: any) => void;
  onSend: (broadcast: any) => void;
  onRefresh: () => void;
}

export default function EmailList({ broadcasts, onEdit, onSend, onRefresh }: EmailListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este email?')) return;

    setDeletingId(id);
    const result = await deleteBroadcast(id);

    if (result.success) {
      toast.success('Email excluído com sucesso.');
      onRefresh();
    } else {
      toast.error(result.message);
    }
    setDeletingId(null);
  };

  return (
    <div className="rounded-md border border-neutral-800 bg-neutral-900">
      <Table>
        <TableHeader className="bg-neutral-950">
          <TableRow className="border-neutral-800 hover:bg-neutral-950">
            <TableHead className="text-neutral-400">Assunto</TableHead>
            <TableHead className="text-neutral-400">Status</TableHead>
            <TableHead className="text-neutral-400">Destinatários</TableHead>
            <TableHead className="text-neutral-400">Data</TableHead>
            <TableHead className="text-right text-neutral-400">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {broadcasts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-neutral-500">
                Nenhum email encontrado.
              </TableCell>
            </TableRow>
          ) : (
            broadcasts.map((email) => (
              <TableRow key={email.id} className="border-neutral-800 hover:bg-neutral-800/50">
                <TableCell className="font-medium text-neutral-200">{email.subject}</TableCell>
                <TableCell>
                  <Badge
                    variant={email.status === 'sent' ? 'default' : 'secondary'}
                    className={
                      email.status === 'sent'
                        ? 'bg-green-900 text-green-300 hover:bg-green-900'
                        : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-700'
                    }
                  >
                    {email.status === 'sent' ? 'Enviado' : 'Rascunho'}
                  </Badge>
                </TableCell>
                <TableCell className="text-neutral-300">
                  {email.status === 'sent' ? email.recipient_count : '-'}
                </TableCell>
                <TableCell className="text-neutral-300">
                  {format(new Date(email.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </TableCell>
                <TableCell className="text-right flex justify-end gap-2">
                  {email.status === 'draft' && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-amber-500 hover:text-amber-400 hover:bg-amber-950"
                        onClick={() => onEdit(email)}
                        title="Editar Rascunho"
                      >
                        <FileEdit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-green-500 hover:text-green-400 hover:bg-green-950"
                        onClick={() => onSend(email)}
                        title="Enviar Agora"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {email.status === 'sent' && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-blue-500 hover:text-blue-400 hover:bg-blue-950"
                      onClick={() => onEdit(email)}
                      title="Reutilizar como base"
                    >
                      <FileEdit className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-950"
                    onClick={() => handleDelete(email.id)}
                    disabled={deletingId === email.id}
                    title="Excluir"
                  >
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
