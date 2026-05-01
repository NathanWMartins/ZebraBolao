import { Box, Typography, Container, Divider } from '@mui/material'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Termos de Uso — Zebra Bolão',
    description: 'Termos de Uso do Zebra Bolão. Leia as regras e condições para utilização da plataforma.',
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

export default function TermosPage() {
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
                        Termos de Uso
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
                            Ao criar uma conta ou utilizar o <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Zebra Bolão</strong>,
                            você concorda com os presentes Termos de Uso. Leia com atenção antes de continuar.
                            Caso não concorde com algum ponto, não utilize o Serviço.
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 6 }} />

                {/* Seções */}
                <Section number="1" title="Sobre o Serviço">
                    <P>
                        O <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Zebra Bolão</strong> é uma plataforma
                        recreativa de bolão esportivo focada na Copa do Mundo de 2026, desenvolvida e operada por
                        Nathan Will Martins, pessoa física, com domicílio no Brasil.
                    </P>
                    <P>
                        O Serviço permite que usuários criem grupos privados, selecionem jogos e registrem palpites
                        sobre os resultados das partidas (vitória do time A, empate ou vitória do time B),
                        competindo em rankings individuais e por grupo.
                    </P>
                    <P>
                        O Zebra Bolão é uma ferramenta de gestão de bolão. Não intermediamos, recebemos,
                        gerenciamos nem distribuímos quaisquer valores financeiros entre os participantes.
                    </P>
                </Section>

                <Section number="2" title="Elegibilidade">
                    <P>Para utilizar o Serviço, você deve:</P>
                    <BulletList items={[
                        'Ter 18 (dezoito) anos ou mais',
                        'Possuir uma conta Google válida para autenticação',
                        'Concordar integralmente com estes Termos de Uso e com nossa Política de Privacidade',
                        'Não ter sido previamente banido ou suspenso do Serviço',
                    ]} />
                    <P>
                        Ao criar uma conta, você declara que atende a todos esses requisitos.
                        O Serviço não é destinado a menores de idade.
                    </P>
                </Section>

                <Section number="3" title="Natureza Recreativa e Responsabilidade Financeira">
                    <P>
                        O Zebra Bolão é uma plataforma estritamente recreativa. É fundamental que você compreenda:
                    </P>

                    <SubTitle>a) Sem intermediação financeira</SubTitle>
                    <P>
                        O Zebra Bolão <strong style={{ color: 'rgba(255,255,255,0.85)' }}>não cobra, recebe, retém
                            nem distribui</strong> qualquer valor financeiro entre os participantes. Toda e qualquer
                        movimentação de dinheiro entre membros de um grupo é de responsabilidade exclusiva dos
                        próprios participantes e do organizador do grupo.
                    </P>

                    <SubTitle>b) Responsabilidade do organizador</SubTitle>
                    <P>
                        O usuário que cria um grupo (líder/organizador) é o único responsável pela organização,
                        coleta e distribuição de eventuais prêmios entre os participantes. O Zebra Bolão não
                        possui qualquer envolvimento nessa relação.
                    </P>

                    <SubTitle>c) Isenção de responsabilidade</SubTitle>
                    <P>
                        O Zebra Bolão não se responsabiliza por disputas, inadimplência, desentendimentos ou
                        quaisquer conflitos financeiros entre membros de um grupo. Ao participar de um bolão com
                        prêmio em dinheiro, você o faz por sua própria conta e risco, assumindo responsabilidade
                        total pela transação.
                    </P>
                </Section>

                <Section number="4" title="Regras dos Palpites">
                    <P>Ao registrar palpites no Serviço, você concorda com as seguintes regras:</P>
                    <BulletList items={[
                        'Palpites só podem ser realizados antes do início oficial da partida',
                        'Uma vez registrado, o palpite não pode ser alterado ou cancelado',
                        'Cada usuário pode registrar apenas um palpite por jogo por grupo',
                        'Somente jogos selecionados pelo líder do grupo estão disponíveis para palpite',
                        'O resultado oficial utilizado para pontuação é o placar ao final do tempo regulamentar (90 minutos)',
                        'Prorrogação e pênaltis não são considerados para o resultado do palpite — apenas o tempo regulamentar',
                    ]} />
                </Section>

                <Section number="5" title="Pontuação e Ranking">
                    <BulletList items={[
                        'Cada palpite correto vale 1 (um) ponto',
                        'O ranking é calculado com base no total de acertos ao longo da Copa (ranking geral) e por dia (ranking diário)',
                        'Em caso de empate no ranking, o prêmio — se houver — é dividido igualmente entre os empatados',
                        'O Zebra Bolão se reserva o direito de corrigir pontuações em caso de erro técnico comprovado',
                        'Resultados e rankings são atualizados automaticamente após a confirmação do resultado oficial do jogo',
                    ]} />
                </Section>

                <Section number="6" title="Conduta do Usuário">
                    <P>Ao utilizar o Serviço, você concorda em não:</P>
                    <BulletList items={[
                        'Criar contas falsas ou múltiplas contas para o mesmo grupo',
                        'Tentar manipular palpites, rankings ou resultados por qualquer meio',
                        'Utilizar bots, scripts ou qualquer automação para interagir com o Serviço',
                        'Compartilhar sua conta com terceiros',
                        'Praticar qualquer ato que comprometa a segurança ou integridade da plataforma',
                        'Utilizar o Serviço para fins ilegais ou que violem direitos de terceiros',
                        'Assediar, ameaçar ou ofender outros usuários',
                    ]} />
                    <P>
                        O descumprimento dessas regras pode resultar na suspensão ou exclusão permanente da sua conta,
                        sem aviso prévio.
                    </P>
                </Section>

                <Section number="7" title="Disponibilidade do Serviço">
                    <P>
                        O Zebra Bolão é oferecido gratuitamente e sem garantia de disponibilidade contínua.
                        Nos reservamos o direito de:
                    </P>
                    <BulletList items={[
                        'Interromper, modificar ou encerrar o Serviço a qualquer momento, com ou sem aviso prévio',
                        'Realizar manutenções programadas ou emergenciais que possam tornar o Serviço temporariamente indisponível',
                        'Alterar funcionalidades, regras ou mecânicas do bolão mediante comunicação prévia',
                    ]} />
                    <P>
                        Não nos responsabilizamos por prejuízos decorrentes de indisponibilidade técnica, falhas
                        de conexão, erros de sistema ou qualquer interrupção do Serviço.
                    </P>
                </Section>

                <Section number="8" title="Limitação de Responsabilidade">
                    <P>
                        Na máxima extensão permitida pela legislação brasileira, o Zebra Bolão e seu operador
                        não são responsáveis por:
                    </P>
                    <BulletList items={[
                        'Perdas financeiras decorrentes de disputas entre participantes de um grupo',
                        'Erros ou atrasos na atualização de resultados por parte da API de dados esportivos utilizada',
                        'Danos causados por acesso não autorizado à sua conta por terceiros',
                        'Perda de dados decorrente de falhas técnicas fora do nosso controle',
                        'Decisões tomadas com base nas informações exibidas no Serviço',
                    ]} />
                </Section>

                <Section number="9" title="Propriedade Intelectual">
                    <P>
                        Todo o conteúdo do Zebra Bolão — incluindo nome, logo, design, código, textos e funcionalidades —
                        é de propriedade de Nathan Will Martins e está protegido pela legislação de propriedade intelectual.
                    </P>
                    <P>
                        É proibida a reprodução, distribuição, modificação ou uso comercial de qualquer parte do
                        Serviço sem autorização prévia e expressa por escrito.
                    </P>
                </Section>

                <Section number="10" title="Anúncios (Google AdSense)">
                    <P>
                        O Serviço exibe anúncios por meio do Google AdSense para viabilizar sua oferta gratuita.
                        Ao utilizar o Zebra Bolão, você concorda com a exibição de anúncios. Os anúncios são
                        gerenciados pelo Google LLC e estão sujeitos à{' '}
                        <ExternalLink href="https://policies.google.com/privacy">
                            Política de Privacidade do Google
                        </ExternalLink>.
                    </P>
                    <P>
                        O Zebra Bolão não é responsável pelo conteúdo dos anúncios exibidos, que são determinados
                        pelo Google com base no seu perfil de navegação.
                    </P>
                </Section>

                <Section number="11" title="Alterações nos Termos">
                    <P>
                        Podemos atualizar estes Termos periodicamente. Alterações relevantes serão comunicadas
                        por e-mail ou mediante aviso no Serviço com antecedência mínima de 10 dias.
                        O uso contínuo do Serviço após a notificação implica a aceitação dos novos Termos.
                    </P>
                </Section>

                <Section number="12" title="Lei Aplicável e Foro">
                    <P>
                        Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o
                        foro da comarca de domicílio do operador para resolução de quaisquer disputas decorrentes
                        destes Termos, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
                    </P>
                </Section>

                <Section number="13" title="Contato">
                    <P>Para dúvidas ou solicitações relacionadas a estes Termos:</P>
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
                </Section>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mt: 2, mb: 4 }} />

                <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
                    Zebra Bolão — Termos de Uso — {today}
                </Typography>

            </Container>
        </Box>
    )
}