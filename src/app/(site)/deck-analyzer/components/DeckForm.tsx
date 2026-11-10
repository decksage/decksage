import { Dispatch, SetStateAction } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface DeckFormProps {
  decklist: string;
  setDecklist: Dispatch<SetStateAction<string>>;
  format: string;
  setFormat: Dispatch<SetStateAction<string>>;
  onAnalyze: () => void;
  loading: boolean;
}

export default function DeckForm({
  decklist,
  setDecklist,
  format,
  setFormat,
  onAnalyze,
  loading,
}: DeckFormProps) {
  return (
    <Card className="bg-white/[0.04] border-white/15">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Inserir Deck</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="format" className="text-foreground">
            Formato de Jogo
          </Label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger id="format" className="bg-neutral-700 border-white/15 text-foreground">
              <SelectValue placeholder="Selecione o formato" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/15">
              <SelectItem value="commander">Commander</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="modern">Modern</SelectItem>
              <SelectItem value="pioneer">Pioneer</SelectItem>
              <SelectItem value="pauper">Pauper</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="decklist" className="text-foreground">
            Lista de Deck
          </Label>
          <Textarea
            id="decklist"
            placeholder="Ex.: 1 Sol Ring\n1 Lightning Bolt"
            value={decklist}
            onChange={(e) => setDecklist(e.target.value)}
            className="bg-neutral-700 border-white/15 text-foreground h-64"
          />
        </div>
        <Button
          onClick={onAnalyze}
          disabled={loading || !decklist.trim()}
          className="w-full"
        >
          {loading ? 'Analisando...' : 'Analisar Deck'}
        </Button>
      </CardContent>
    </Card>
  );
}
