interface StickerPickerProps {
  onSelect: (stickerId: string) => void
  selectedSticker?: string
  displayOnly?: boolean
}

// Temporary sticker emojis - sẽ thay bằng SVG sau
const STICKERS = [
  { id: 'heart', emoji: '❤️' },
  { id: 'like', emoji: '👍' },
  { id: 'laugh', emoji: '😂' },
  { id: 'love', emoji: '😍' },
  { id: 'wow', emoji: '😮' },
  { id: 'sad', emoji: '😢' },
  { id: 'angry', emoji: '😠' },
  { id: 'fire', emoji: '🔥' },
  { id: 'star', emoji: '⭐' },
  { id: 'party', emoji: '🎉' },
  { id: 'music', emoji: '🎵' },
  { id: 'cake', emoji: '🎂' },
]

export default function StickerPicker({ onSelect, selectedSticker, displayOnly }: StickerPickerProps) {
  if (displayOnly) {
    const sticker = STICKERS.find(s => s.id === selectedSticker)
    return <span className="text-4xl">{sticker?.emoji || '😊'}</span>
  }

  return (
    <div className="bg-white/90 rounded-2xl p-4 grid grid-cols-4 gap-3">
      {STICKERS.map((sticker) => (
        <button
          key={sticker.id}
          onClick={() => onSelect(sticker.id)}
          className="p-3 hover:bg-cute-pink/20 rounded-xl transition-colors text-3xl hover:scale-110 transform duration-200"
        >
          {sticker.emoji}
        </button>
      ))}
    </div>
  )
}
