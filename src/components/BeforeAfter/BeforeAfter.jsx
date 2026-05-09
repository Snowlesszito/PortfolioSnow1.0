import './BeforeAfter.css'

import before from '../../assets/images/outros/antesedepois/antes.jpg'
import after from '../../assets/images/outros/antesedepois/depois.jpg'

function BeforeAfter() {
  return (
    <section className="ba-section">
      <h2 className="ba-title">Before & After</h2>

      <div className="ba-row">
        <div className="ba-panel">
          <div className="ba-panel-media">
            <img src={before} alt="Before" />
          </div>
          <span className="ba-panel-label">Before</span>
        </div>

        <div className="ba-arrow">
          <svg viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 12 H40 M30 4 L40 12 L30 20" stroke="#66a4db" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>process</span>
        </div>

        <div className="ba-panel ba-panel-process">
          <div className="ba-panel-media">
            <video autoPlay loop muted playsInline>
              <source src={`${import.meta.env.BASE_URL}timelapse.mp4`} type="video/mp4" />
            </video>
          </div>
          <span className="ba-panel-label">How it's made</span>
        </div>

        <div className="ba-arrow">
          <svg viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 12 H40 M30 4 L40 12 L30 20" stroke="#66a4db" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>result</span>
        </div>

        <div className="ba-panel">
          <div className="ba-panel-media">
            <img src={after} alt="After" />
          </div>
          <span className="ba-panel-label">After</span>
        </div>
      </div>

    </section>
  )
}

export default BeforeAfter
