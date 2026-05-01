import { getFlagUrl } from '@/lib/teamFlags'

interface TeamFlagProps {
    teamName: string
    size?: 20 | 40 | 80 | 160
    style?: React.CSSProperties
}

export default function TeamFlag({ teamName, size = 20, style }: TeamFlagProps) {
    const fetchSize = size <= 40 ? 80 : 160;

    return (
        <img
            src={getFlagUrl(teamName, fetchSize)}
            alt={`Bandeira ${teamName}`}
            width={size}
            height={Math.round(size * 0.67)}
            style={{
                objectFit: 'cover',
                borderRadius: 3,
                ...style,
            }}
        />
    )
}