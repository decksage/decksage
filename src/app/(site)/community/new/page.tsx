import CommunityPublicationComposer from './CommunityPublicationComposer';
import PageHeader from '../../components/page/PageHeader';

export const metadata = {
  title: 'Nova publicação | DeckSage',
};

export default function NewCommunityPublicationPage() {
  return (
    <>
      <PageHeader
        kicker="Comunidade"
        title="Novo primer"
        description="Escreva o rascunho e envie para a revisão da equipe. Depois de aprovado, ele entra na lista pública."
        back={{ href: '/community', label: 'Publicações' }}
        className="border-b-0"
      />
      <div className="mx-auto max-w-3xl px-6 pb-20">
        <CommunityPublicationComposer />
      </div>
    </>
  );
}
