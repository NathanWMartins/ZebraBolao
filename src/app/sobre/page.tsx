import { Box, Typography, Container } from '@mui/material'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import Footer from '../components/Footer'

export const metadata: Metadata = {
    title: 'Sobre — Zebra Bolão',
    description: 'Conheça o Zebra Bolão, a plataforma gratuita de palpites para a Copa do Mundo 2026. Criado por Nathan Will Martins.',
}

function InfoCard({ label, value }: { label: string; value: string }) {
    return (
        <Box sx={{
            bgcolor: 'rgba(0,0,0,0.5)',
            border: '0.5px solid rgba(255,255,255,0.07)',
            borderRadius: '10px',
            p: 2.5,
        }}>
            <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', mb: 0.75 }}>
                {label}
            </Typography>
            <Typography sx={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>
                {value}
            </Typography>
        </Box>
    )
}

export default function SobrePage() {
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
                <Box sx={{ mb: 8 }}>
                    <Box sx={{
                        display: 'inline-block',
                        bgcolor: 'rgba(201,148,10,0.12)',
                        border: '0.5px solid rgba(201,148,10,0.3)',
                        borderRadius: '20px',
                        px: 2, py: 0.6,
                        mb: 3,
                    }}>
                        <Typography sx={{ fontSize: 12, color: '#C9940A' }}>
                            Sobre o projeto
                        </Typography>
                    </Box>

                    <Typography variant="h1" sx={{
                        fontSize: { xs: 28, md: 38 },
                        fontWeight: 600,
                        color: '#fff',
                        letterSpacing: -0.5,
                        mb: 2,
                    }}>
                        O que é o Zebra Bolão?
                    </Typography>

                    <Typography sx={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, maxWidth: 620 }}>
                        O Zebra Bolão é uma plataforma gratuita de palpites criada para tornar a Copa do Mundo 2026
                        mais divertida entre amigos, família e colegas de trabalho. Sem dinheiro envolvido, sem
                        complicação — só a emoção de acertar o resultado dos jogos.
                    </Typography>
                </Box>

                {/* O projeto */}
                <Box sx={{ mb: 8 }}>
                    <Typography sx={{ fontSize: 20, fontWeight: 600, color: '#fff', mb: 3, letterSpacing: -0.3 }}>
                        Como surgiu
                    </Typography>
                    <Typography sx={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.9, mb: 2 }}>
                        O Zebra nasceu da vontade de ter um bolão simples e moderno para a Copa do Mundo 2026,
                        sem depender de planilhas de Excel ou grupos de WhatsApp desorganizados. A ideia foi criar
                        um lugar onde qualquer pessoa consegue montar seu grupo, convidar os amigos com um link e
                        acompanhar o ranking em tempo real — tudo pelo celular ou computador.
                    </Typography>
                    <Typography sx={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.9 }}>
                        O nome vem do futebol: a <Box component="span" sx={{ color: '#C9940A' }}>zebra</Box> é
                        aquele resultado inesperado que ninguém previu. E na Copa, zebra sempre tem.
                    </Typography>
                </Box>

                {/* Natureza do serviço */}
                <Box sx={{
                    bgcolor: 'rgba(201,148,10,0.06)',
                    border: '0.5px solid rgba(201,148,10,0.2)',
                    borderRadius: '12px',
                    p: { xs: 3, md: 4 },
                    mb: 8,
                }}>
                    <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#C9940A', mb: 1.5 }}>
                        Plataforma 100% recreativa
                    </Typography>
                    <Typography sx={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.9 }}>
                        O Zebra Bolão <strong style={{ color: 'rgba(255,255,255,0.85)' }}>não envolve dinheiro real</strong> em nenhuma etapa.
                        Nenhum valor financeiro é cobrado, armazenado ou distribuído pela plataforma.
                        É um jogo de previsões para fins recreativos, assim como qualquer outro passatempo entre amigos.
                        Se os participantes de um grupo optarem por combinar algum prêmio simbólico entre si, isso
                        é feito diretamente entre eles, sem qualquer intermediação do Zebra.
                    </Typography>
                </Box>

                {/* Funcionalidades */}
                <Box sx={{ mb: 8 }}>
                    <Typography sx={{ fontSize: 20, fontWeight: 600, color: '#fff', mb: 3, letterSpacing: -0.3 }}>
                        O que você pode fazer
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {[
                            'Criar grupos privados e convidar participantes via link ou QR code',
                            'Fazer palpites nos jogos da Copa do Mundo 2026 antes de cada partida começar',
                            'Acompanhar o ranking do seu grupo atualizado automaticamente após cada resultado',
                            'Participar de vários grupos ao mesmo tempo — trabalho, família, amigos',
                            'Acessar pelo celular ou computador, sem precisar instalar nenhum aplicativo',
                        ].map((item) => (
                            <Box key={item} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                <Box sx={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    bgcolor: '#C9940A', mt: '7px', flexShrink: 0,
                                }} />
                                <Typography sx={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8 }}>
                                    {item}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Informações do responsável */}
                <Box sx={{ mb: 8 }}>
                    <Typography sx={{ fontSize: 20, fontWeight: 600, color: '#fff', mb: 3, letterSpacing: -0.3 }}>
                        Responsável pelo projeto
                    </Typography>
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                        gap: 1.5,
                        mb: 3,
                    }}>
                        <InfoCard label="Nome" value="Nathan Will Martins" />
                        <InfoCard label="País" value="Brasil" />
                        <InfoCard label="Tipo" value="Pessoa física" />
                        <InfoCard label="Contato" value="nathanwillmartins@gmail.com" />
                    </Box>
                    <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7 }}>
                        O Zebra Bolão é um projeto independente, desenvolvido e mantido por uma única pessoa.
                        Para dúvidas, sugestões ou questões relacionadas à privacidade, entre em contato pelo e-mail acima.
                    </Typography>
                </Box>
            </Container>
            <Footer />
        </Box>
    )
}
