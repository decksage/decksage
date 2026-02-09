'use client'

import { useState, useTransition, useEffect } from 'react';
import dynamic from 'next/dynamic';
import EmailPreview from '@/components/admin/EmailPreview';
import EmailList from '@/components/admin/EmailList';
import { sendBroadcastEmail, saveDraft, getBroadcasts } from '@/app/actions/emailActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { Loader2, Send, Plus, ArrowLeft, Save } from 'lucide-react';
import { Switch } from "@/components/ui/switch";

const EmailEditor = dynamic(() => import('@/components/admin/EmailEditor'), { ssr: false });

export default function EmailBroadcastPage() {
    const [view, setView] = useState<'list' | 'create'>('list');

    // Editor State
    const [id, setId] = useState<string | null>(null);
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [blocks, setBlocks] = useState('');
    const [isTest, setIsTest] = useState(true);
    const [testEmail, setTestEmail] = useState('');

    // Data State
    const [broadcasts, setBroadcasts] = useState<any[]>([]);
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [isPending, startTransition] = useTransition();

    // Load broadcasts on mount
    useEffect(() => {
        loadBroadcasts();
    }, []);

    async function loadBroadcasts() {
        setIsLoadingList(true);
        const data = await getBroadcasts();
        setBroadcasts(data);
        setIsLoadingList(false);
    }

    const handleNew = () => {
        setId(null);
        setSubject('');
        setContent('');
        setBlocks('');
        setIsTest(true);
        setView('create');
    };

    const handleEdit = (email: any) => {
        // If it's sent, we copy the content but create a new draft (no ID), unless we want to edit a sent email record (unlikely)
        // If it's draft, we set ID to update it.
        if (email.status === 'sent') {
            setId(null); // Copy mode
            setSubject(`[Cópia] ${email.subject}`);
        } else {
            setId(email.id); // Edit draft mode
            setSubject(email.subject);
        }
        setContent(email.content);
        setBlocks(email.blocks ? JSON.stringify(email.blocks) : ''); // Load blocks if available
        setIsTest(true);
        setView('create');
    };

    const handleEditorChange = (html: string, blocksJson: string) => {
        setContent(html);
        setBlocks(blocksJson);
    };

    const handleSaveDraft = async () => {
        if (!subject) {
            toast.error("Assunto é obrigatório para salvar rascunho.");
            return;
        }

        startTransition(async () => {
            const formData = new FormData();
            if (id) formData.append('id', id);
            formData.append('subject', subject);
            formData.append('content', content);
            formData.append('blocks', blocks);

            const result = await saveDraft(formData);
            if (result.success) {
                toast.success(result.message);
                if (result.id) setId(result.id);
                loadBroadcasts(); // Refresh list in background
            } else {
                toast.error(result.message);
            }
        });
    };

    const handleSend = async () => {
        if (!subject || !content) {
            toast.error("Assunto e conteúdo do email são obrigatórios.");
            return;
        }

        if (isTest && !testEmail) {
            toast.error("Para teste, informe o email de destino.");
            return;
        }

        startTransition(async () => {
            const formData = new FormData();
            formData.append('subject', subject);
            formData.append('content', content);
            formData.append('blocks', blocks);
            formData.append('is_test', String(isTest));
            if (isTest) formData.append('test_email', testEmail);

            const result = await sendBroadcastEmail(null, formData);
            if (result.success) {
                toast.success(result.message);
                if (!isTest) {
                    setView('list');
                    loadBroadcasts();
                }
            } else {
                toast.error(result.message);
            }
        });
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-amber-500">Disparo de Emails</h1>
                    <p className="text-neutral-400 mt-1">Gerencie comunicados e analise envios.</p>
                </div>
                {view === 'list' && (
                    <Button onClick={handleNew} className="bg-amber-600 hover:bg-amber-700 text-white">
                        <Plus className="mr-2 h-4 w-4" /> Novo Email
                    </Button>
                )}
                {view === 'create' && (
                    <Button variant="outline" onClick={() => setView('list')} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Lista
                    </Button>
                )}
            </header>

            {view === 'list' ? (
                isLoadingList ? (
                    <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>
                ) : (
                    <EmailList broadcasts={broadcasts} onEdit={handleEdit} onRefresh={loadBroadcasts} />
                )
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Editor Column */}
                    <div className="space-y-6">
                        <Card className="bg-neutral-900 border-neutral-800">
                            <CardHeader>
                                <CardTitle>{id ? 'Editar Rascunho' : 'Novo Email'}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Assunto</Label>
                                    <Input
                                        id="subject"
                                        placeholder="Ex: Novidades na plataforma DeckSage!"
                                        className="bg-neutral-800 border-neutral-700"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Conteúdo (HTML)</Label>
                                    <EmailEditor
                                        initialValue={content}
                                        initialBlocks={blocks}
                                        onChange={handleEditorChange}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-neutral-900 border-neutral-800">
                            <CardHeader>
                                <CardTitle>Ações</CardTitle>
                                <CardDescription>Salve como rascunho ou envie.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="mode-toggle"
                                        checked={isTest}
                                        onCheckedChange={setIsTest}
                                    />
                                    <Label htmlFor="mode-toggle">Modo de Teste</Label>
                                </div>

                                {isTest ? (
                                    <div className="space-y-2">
                                        <Label>Email de Teste</Label>
                                        <Input
                                            placeholder="seu-email@exemplo.com"
                                            className="bg-neutral-800 border-neutral-700"
                                            value={testEmail}
                                            onChange={(e) => setTestEmail(e.target.value)}
                                        />
                                    </div>
                                ) : (
                                    <div className="p-4 border border-red-900/50 bg-red-900/10 rounded-lg">
                                        <p className="text-red-400 font-bold flex items-center gap-2">
                                            ⚠️ Atenção: Modo Produção
                                        </p>
                                        <p className="text-sm text-red-300 mt-1">
                                            Enviará para <strong>TODOS</strong> os usuários.
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <Button
                                        onClick={handleSaveDraft}
                                        disabled={isPending}
                                        variant="outline"
                                        className="flex-1 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                                    >
                                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Salvar Rascunho
                                    </Button>
                                    <Button
                                        onClick={handleSend}
                                        disabled={isPending}
                                        className={`flex-1 ${isTest ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}
                                    >
                                        {isPending ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> ...</>
                                        ) : (
                                            <><Send className="mr-2 h-4 w-4" /> {isTest ? 'Enviar Teste' : 'ENVIAR'}</>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Preview Column */}
                    <div className="space-y-6">
                        <Card className="bg-neutral-900 border-neutral-800 h-full">
                            <CardHeader>
                                <CardTitle>Visualização</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="desktop" className="w-full">
                                    <TabsList className="bg-neutral-800">
                                        <TabsTrigger value="desktop">Desktop</TabsTrigger>
                                        <TabsTrigger value="mobile">Mobile</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="desktop" className="mt-4">
                                        <div className="max-w-full">
                                            <EmailPreview content={content} />
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="mobile" className="mt-4 flex justify-center">
                                        <div className="w-[375px] border-x-8 border-y-[20px] border-neutral-800 rounded-3xl overflow-hidden shadow-xl">
                                            <EmailPreview content={content} />
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
