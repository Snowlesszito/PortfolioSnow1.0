import './SectionBackground.css'

const bgModules = import.meta.glob(
  '../assets/images/outros/backgrounds/minecraft/*.{jpg,JPG,jpeg,png,webp,PNG}',
  { eager: true }
)

const backgrounds = Object.values(bgModules).map(mod => mod.default)

export default function SectionBackground({ index }) {
  const bg = backgrounds[index % backgrounds.length]
  return (
    <div className="section-bg" style={{ backgroundImage: `url(${bg})` }}>
      <div className="section-bg-overlay" />
    </div>
  )
}