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

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

    // Confirmation State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingSend, setPendingSend] = useState<{ id?: string, subject?: string, content?: string, blocks?: string, is_test?: boolean, test_email?: string } | null>(null);

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

    // Called by the "Send" button in Editor or "Send" icon in List
    const initiateSend = (emailData?: any) => {
        // If emailData is passed (from List), use it. Otherwise use Editor state.
        const data = emailData || { id, subject, content, blocks };

        if (!data.subject || !data.content) {
            toast.error("Assunto e conteúdo do email são obrigatórios.");
            return;
        }

        if (isTest && !testEmail && !emailData) { // If editor is test mode (list mode is always production/send now, or we should clarify)
            // Actually, list "Send" implies sending to everyone from draft.
            // Let's assume list "Send" is always Production Send.
        }

        // We only show confirmation if it is NOT a test, OR if we want to confirm tests too.
        // User asked for "Publish and Send" with confirmation. Usually implies Production.

        // If we are in Editor and IS TEST, just send immediately (or maybe confirm too? let's confirm for safety if requested).
        // User said: "create a button to publish and send to user base. With confirmation modal"

        // Strategy:
        // 1. If Editor -> check `isTest`. If `isTest`, validation for test email. If valid, maybe skip modal or show simple one?
        //    Actually user said "publish and send to user base", which implies Production.
        //    So let's make the modal specifically for the "Production Send".

        // If coming from List: It's a draft. We want to send to ALL users.
        // If coming from Editor: We check `isTest` toggle.

        if (emailData) {
            // Coming from List. Always "Production" send.
            setPendingSend({ ...emailData, is_test: false });
            setIsConfirmOpen(true);
        } else {
            // Coming from Editor.
            if (isTest) {
                if (!testEmail) {
                    toast.error("Para teste, informe o email de destino.");
                    return;
                }
                // Test send - maybe direct?
                executeSend({ subject, content, blocks, is_test: true, test_email: testEmail });
            } else {
                // Production Send
                setPendingSend({ id, subject, content, blocks, is_test: false });
                setIsConfirmOpen(true);
            }
        }
    };

    const executeSend = async (data: any) => {
        startTransition(async () => {
            const formData = new FormData();
            if (data.id) formData.append('id', data.id); // Update existing draft to sent status
            formData.append('subject', data.subject);
            formData.append('content', data.content);
            if (data.blocks) formData.append('blocks', typeof data.blocks === 'string' ? data.blocks : JSON.stringify(data.blocks));
            formData.append('is_test', String(data.is_test));
            if (data.test_email) formData.append('test_email', data.test_email);

            const result = await sendBroadcastEmail(null, formData);
            if (result.success) {
                toast.success(result.message);
                if (!data.is_test) {
                    setView('list');
                    loadBroadcasts();
                    // Close modal
                    setIsConfirmOpen(false);
                    setPendingSend(null);
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
                    <EmailList
                        broadcasts={broadcasts}
                        onEdit={handleEdit}
                        onSend={(email) => initiateSend(email)}
                        onRefresh={loadBroadcasts}
                    />
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
                                        onClick={() => initiateSend()}
                                        disabled={isPending}
                                        className={`flex-1 ${isTest ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}
                                    >
                                        {isPending ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> ...</>
                                        ) : (
                                            <><Send className="mr-2 h-4 w-4" /> {isTest ? 'Enviar Teste' : 'PUBLICAR E ENVIAR'}</>
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

            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent className="bg-neutral-900 border-neutral-800 text-neutral-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-500 text-xl flex items-center gap-2">
                            ⚠️ Confirmar Envio em Massa
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-neutral-400 text-base">
                            Você está prestes a enviar o email <strong>"{pendingSend?.subject}"</strong> para <strong>TODOS</strong> os usuários da base.
                            <br /><br />
                            Esta ação não pode ser desfeita. Tem certeza que deseja continuar?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-neutral-300">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => pendingSend && executeSend(pendingSend)}
                            className="bg-red-600 hover:bg-red-700 text-white border-none"
                        >
                            {isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Sim, Enviar Agora"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
