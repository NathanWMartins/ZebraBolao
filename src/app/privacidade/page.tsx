import { Box, Typography, Container, Divider } from '@mui/material'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Política de Privacidade — Zebra Bolão',
    description: 'Política de Privacidade do Zebra Bolão. Saiba como coletamos, usamos e protegemos seus dados pessoais.',
}

const today = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date('2026-05-01'))

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
    return (
        <Box sx={{ mb: 5 }}>
            <Typography sx={{
                fontSize: { xs: 17, md: 19 },
                fontWeight: 600,
                color: '#C9940A',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
            }}>
                <Box component="span" sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: 'rgba(201,148,10,0.12)',
                    border: '0.5px solid rgba(201,148,10,0.3)',
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                }}>
                    {number}
                </Box>
                {title}
            </Typography>
            <Box sx={{ pl: { xs: 0, md: 5 } }}>
                {children}
            </Box>
        </Box>
    )
}

function P({ children }: { children: React.ReactNode }) {
    return (
        <Typography sx={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.8,
            mb: 1.5,
        }}>
            {children}
        </Typography>
    )
}

function SubTitle({ children }: { children: React.ReactNode }) {
    return (
        <Typography sx={{
            fontSize: 13,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.85)',
            mt: 2,
            mb: 1,
        }}>
            {children}
        </Typography>
    )
}

function BulletList({ items }: { items: string[] }) {
    return (
        <Box component="ul" sx={{ pl: 2.5, mt: 0.5, mb: 1.5 }}>
            {items.map((item, i) => (
                <Box component="li" key={i} sx={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.6)',
                    lineHeight: 1.8,
                    mb: 0.5,
                    '&::marker': { color: '#C9940A' },
                }}>
                    {item}
                </Box>
            ))}
        </Box>
    )
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Box
            component="a"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: '#C9940A', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
            {children}
        </Box>
    )
}

export default function PrivacidadePage() {
    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: '#111110',
            backgroundImage: 'repeating-linear-gradient(-55deg, transparent, transparent 18px, rgba(255,255,255,0.03) 18px, rgba(255,255,255,0.03) 36px)',
        }}>
            {/* Navbar */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: 'rgba(0,0,0,0.7)',
                px: 3, py: 0.5,
                borderBottom: '0.5px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
                position: 'sticky',
                top: 0,
                zIndex: 50,
            }}>
                <Link href="/" style={{ textDecoration: 'none' }}>
                    <Image src="/LogoZebra.png" alt="Zebra Bolão" width={140} height={60} style={{ objectFit: 'contain' }} />
                </Link>
                <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                    Copa 2026
                </Typography>
            </Box>

            <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 }, px: { xs: 3, md: 4 } }}>

                {/* Header */}
                <Box sx={{ mb: 6 }}>
                    <Box sx={{
                        display: 'inline-block',
                        bgcolor: 'rgba(201,148,10,0.12)',
                        border: '0.5px solid rgba(201,148,10,0.3)',
                        borderRadius: '20px',
                        px: 2, py: 0.6,
                        mb: 3,
                    }}>
                        <Typography sx={{ fontSize: 12, color: '#C9940A' }}>
                            Documento legal
                        </Typography>
                    </Box>

                    <Typography variant="h1" sx={{
                        fontSize: { xs: 28, md: 38 },
                        fontWeight: 600,
                        color: '#fff',
                        letterSpacing: -0.5,
                        mb: 1.5,
                    }}>
                        Política de Privacidade
                    </Typography>

                    <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', mb: 4 }}>
                        Última atualização: {today}
                    </Typography>

                    <Box sx={{
                        bgcolor: 'rgba(201,148,10,0.07)',
                        border: '0.5px solid rgba(201,148,10,0.2)',
                        borderRadius: '10px',
                        p: 2.5,
                    }}>
                        <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
                            Esta Política de Privacidade descreve como o <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Zebra Bolão</strong> coleta,
                            usa e protege seus dados pessoais, em conformidade com a{' '}
                            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>.
                            Ao utilizar o Serviço, você declara ter lido e compreendido este documento.
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 6 }} />

                {/* Seções */}
                <Section number="1" title="Introdução">
                    <P>
                        O Zebra Bolão é uma plataforma de bolão esportivo focada na Copa do Mundo de 2026,
                        desenvolvida e operada por <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Nathan Will Martins</strong>,
                        pessoa física, com domicílio no Brasil.
                    </P>
                    <P>
                        Caso não concorde com os termos aqui descritos, solicitamos que não utilize o Serviço.
                        Para dúvidas, entre em contato pelo e-mail indicado na seção 13.
                    </P>
                </Section>

                <Section number="2" title="Dados Pessoais Coletados">
                    <P>Coletamos apenas os dados estritamente necessários para o funcionamento do Serviço:</P>

                    <SubTitle>a) Dados fornecidos via autenticação Google (OAuth 2.0)</SubTitle>
                    <BulletList items={[
                        'Nome completo',
                        'Endereço de e-mail',
                        'Foto de perfil (URL pública da conta Google)',
                        'Identificador único do Google (Google ID)',
                    ]} />

                    <SubTitle>b) Dados gerados pelo uso do Serviço</SubTitle>
                    <BulletList items={[
                        'Palpites realizados nos jogos selecionados',
                        'Grupos (bolões) criados ou dos quais participa',
                        'Pontuação e histórico de acertos',
                        'Data e hora de acesso e de cada ação realizada',
                    ]} />

                    <SubTitle>c) Dados coletados automaticamente pelo Google AdSense</SubTitle>
                    <BulletList items={[
                        'Endereço IP',
                        'Identificadores de dispositivo e navegador',
                        'Dados de comportamento de navegação para exibição de anúncios relevantes',
                        'Cookies de publicidade e preferências de anúncios',
                    ]} />
                    <P>
                        Esses dados são coletados diretamente pelo Google LLC. Consulte a{' '}
                        <ExternalLink href="https://policies.google.com/privacy">Política de Privacidade do Google</ExternalLink>{' '}
                        para mais informações.
                    </P>
                </Section>

                <Section number="3" title="Finalidade do Tratamento">
                    <P>Utilizamos seus dados pessoais para as seguintes finalidades:</P>
                    <BulletList items={[
                        'Autenticar sua identidade e manter sua sessão ativa no Serviço',
                        'Permitir a criação e participação em grupos de bolão',
                        'Registrar e exibir seus palpites e pontuação',
                        'Calcular e exibir rankings individuais e por grupo',
                        'Exibir anúncios relevantes por meio do Google AdSense para manutenção do Serviço gratuito',
                        'Cumprir obrigações legais e regulatórias aplicáveis',
                    ]} />
                </Section>

                <Section number="4" title="Base Legal para o Tratamento (LGPD)">
                    <P>O tratamento está fundamentado nas seguintes hipóteses legais do artigo 7º da LGPD:</P>
                    <BulletList items={[
                        'Execução de contrato: para fornecer as funcionalidades do Serviço solicitadas ao criar sua conta',
                        'Consentimento: para exibição de anúncios personalizados pelo Google AdSense, mediante aceite no banner de cookies',
                        'Legítimo interesse: para segurança e integridade da plataforma',
                        'Cumprimento de obrigação legal: quando exigido pela legislação brasileira',
                    ]} />
                </Section>

                <Section number="5" title="Compartilhamento de Dados">
                    <P>Não vendemos nem comercializamos seus dados pessoais. O compartilhamento ocorre apenas nas seguintes situações:</P>

                    <SubTitle>a) Prestadores de serviço essenciais</SubTitle>
                    <BulletList items={[
                        'Supabase Inc. — infraestrutura de banco de dados e autenticação',
                        'Google LLC — autenticação OAuth e plataforma de anúncios (AdSense)',
                        'Vercel Inc. — hospedagem e entrega da aplicação web',
                    ]} />

                    <SubTitle>b) Google AdSense</SubTitle>
                    <P>
                        O Google AdSense pode coletar e processar dados seus para exibir anúncios personalizados.
                        O Google atua como controlador independente desses dados. Gerencie suas preferências em{' '}
                        <ExternalLink href="https://adssettings.google.com">adssettings.google.com</ExternalLink>.
                    </P>

                    <SubTitle>c) Obrigações legais</SubTitle>
                    <P>Podemos divulgar dados quando exigido por lei, ordem judicial ou autoridade competente.</P>
                </Section>

                <Section number="6" title="Transferência Internacional de Dados">
                    <P>
                        Seus dados podem ser processados em servidores fora do Brasil (principalmente nos EUA),
                        pelos nossos prestadores de serviço (Supabase, Google, Vercel). Essas transferências ocorrem
                        com base em garantias adequadas de proteção, conforme o artigo 33 da LGPD.
                    </P>
                </Section>

                <Section number="7" title="Retenção e Exclusão de Dados">
                    <P>Seus dados são mantidos enquanto sua conta estiver ativa. Ao solicitar a exclusão:</P>
                    <BulletList items={[
                        'Seus dados de perfil, palpites e histórico serão excluídos em até 30 dias corridos',
                        'Dados anonimizados poderão ser mantidos para fins estatísticos',
                        'Dados necessários ao cumprimento de obrigação legal serão retidos pelo prazo exigido em lei',
                    ]} />
                    <P>Para solicitar a exclusão, entre em contato pelo e-mail da seção 13.</P>
                </Section>

                <Section number="8" title="Segurança dos Dados">
                    <P>Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo:</P>
                    <BulletList items={[
                        'Autenticação via OAuth 2.0 com o Google (sem armazenamento de senhas)',
                        'Comunicação criptografada via HTTPS/TLS em todas as requisições',
                        'Controle de acesso por nível de usuário (Row Level Security no banco de dados)',
                        'Tokens de sessão com expiração automática',
                    ]} />
                    <P>
                        Em caso de incidente de segurança, notificaremos os titulares afetados e a{' '}
                        <strong style={{ color: 'rgba(255,255,255,0.85)' }}>ANPD</strong> nos prazos legais.
                    </P>
                </Section>

                <Section number="9" title="Seus Direitos como Titular dos Dados">
                    <P>Nos termos da LGPD, você tem direito a:</P>
                    <BulletList items={[
                        'Confirmação da existência de tratamento dos seus dados pessoais',
                        'Acesso aos dados que mantemos sobre você',
                        'Correção de dados incompletos, inexatos ou desatualizados',
                        'Anonimização, bloqueio ou eliminação de dados desnecessários',
                        'Portabilidade dos seus dados a outro fornecedor de serviço',
                        'Eliminação dos dados pessoais tratados com base no seu consentimento',
                        'Revogação do consentimento a qualquer momento, inclusive para anúncios personalizados',
                        'Oposição ao tratamento de dados em desconformidade com a LGPD',
                    ]} />
                    <P>Para exercer qualquer um desses direitos, entre em contato pelo e-mail da seção 13. Responderemos em até 15 dias úteis.</P>
                </Section>

                <Section number="10" title="Cookies e Google AdSense">
                    <SubTitle>a) Cookies essenciais</SubTitle>
                    <P>
                        Necessários para o funcionamento do Serviço, como manutenção da sessão autenticada.
                        Não podem ser desativados sem comprometer o uso da plataforma.
                    </P>

                    <SubTitle>b) Cookies de publicidade (Google AdSense)</SubTitle>
                    <P>
                        O Google AdSense utiliza cookies para exibir anúncios personalizados com base nos seus
                        interesses e histórico de navegação. Você pode optar por não receber anúncios personalizados:
                    </P>
                    <BulletList items={[
                        'Acessando as configurações em adssettings.google.com',
                        'Instalando o plugin de opt-out disponível em google.com/settings/ads/plugin',
                        'Desativando cookies de terceiros nas configurações do seu navegador',
                    ]} />
                    <P>A desativação não impede a exibição de anúncios, mas eles deixarão de ser personalizados.</P>
                </Section>

                <Section number="11" title="Menores de Idade">
                    <P>
                        O Zebra Bolão é destinado exclusivamente a pessoas com{' '}
                        <strong style={{ color: 'rgba(255,255,255,0.85)' }}>18 (dezoito) anos ou mais</strong>.
                        Não coletamos intencionalmente dados de menores. Caso identifiquemos que um menor criou
                        uma conta, excluiremos seus dados imediatamente. Se você é responsável por um menor nessa
                        situação, entre em contato pelo e-mail abaixo.
                    </P>
                </Section>

                <Section number="12" title="Alterações nesta Política">
                    <P>
                        Podemos atualizar esta Política periodicamente. Quando houver alterações relevantes,
                        notificaremos você por e-mail ou mediante aviso no Serviço, com antecedência mínima de
                        10 dias antes da entrada em vigor das mudanças.
                    </P>
                </Section>

                <Section number="13" title="Contato">
                    <P>Para dúvidas, solicitações ou reclamações sobre seus dados pessoais:</P>
                    <Box sx={{
                        bgcolor: 'rgba(255,255,255,0.04)',
                        border: '0.5px solid rgba(255,255,255,0.08)',
                        borderRadius: '10px',
                        p: 3,
                        mt: 2,
                    }}>
                        <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: 15, mb: 0.5 }}>
                            Nathan Will Martins
                        </Typography>
                        <Typography sx={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', mb: 0.5 }}>
                            E-mail:{' '}
                            <ExternalLink href="mailto:nathanwillmartins@gmail.com">
                                nathanwillmartins@gmail.com
                            </ExternalLink>
                        </Typography>
                        <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                            Prazo de resposta: até 15 dias úteis
                        </Typography>
                    </Box>
                    <P>
                        Você também pode apresentar reclamação diretamente à{' '}
                        <ExternalLink href="https://www.gov.br/anpd">
                            Autoridade Nacional de Proteção de Dados (ANPD)
                        </ExternalLink>.
                    </P>
                </Section>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mt: 2, mb: 4 }} />

                <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
                    Zebra Bolão — Política de Privacidade — {today}
                </Typography>

            </Container>
        </Box>
    )
}