import { useNavigate } from 'react-router-dom'
import './TosPage.css'

const sections = [
  {
    title: '1 — Commitment',
    items: [
      'All requests will be reviewed and must comply with these Terms of Service.',
      'Jobs are selected manually — the artist chooses the projects they want to work on. Some requests may be refused without justification.',
      'Upon acceptance, the client will receive an order confirmation and can track progress via direct message.',
      'The client must provide all necessary information and references before work begins (images, description, style, etc.).',
      'It is recommended to gather everything in a single file or folder (PDF, Google Docs, or Google Drive).',
      'The customer grants the artist the non-exclusive right to use their references solely for the execution of the commissioned artwork.',
      'The artist undertakes to carry out the work in good faith, ensuring originality to the best of their knowledge.',
      'The artist reserves the right to refuse requests with offensive or illegal content.',
    ]
  },
  {
    title: '2 — Deadlines & Process',
    items: [
      'Standard delivery time is 2 to 7 business days, varying by complexity and waiting list.',
      'The customer will receive an initial draft for approval before finalizing payment.',
      'Progress updates (WIPs) may be requested, as long as they do not disrupt the workflow.',
      'Final delivery via Google Drive, Discord, Twitter, or email — in PNG or JPG formats.',
      'Original files (PSD, AI, etc.) are NOT provided.',
      'If the deadline needs adjustment, the customer will be informed in advance.',
    ]
  },
  {
    title: '3 — Content Restrictions',
    items: [
      'The artist does not undertake work involving:',
      'Explicit sexual content',
      'Extreme gore',
      'Offensive or discriminatory themes',
      'Misuse of images of real people',
      'Direct reproduction of other artists styles or works',
    ]
  },
  {
    title: '4 — Revisions & Changes',
    items: [
      'Up to 3 revisions are allowed during the drafting process at no additional cost.',
      'After the final artwork is approved, only minor corrections will be accepted free of charge.',
      'Major changes may incur additional charges, communicated before execution.',
      'The client may not alter, edit, or redesign the final artwork without the artists permission.',
    ]
  },
  {
    title: '5 — Communication',
    items: [
      'Communication will take place exclusively via Discord, Twitter, and email.',
      'The artists response time may vary up to 3 business days.',
      'If the client fails to respond for more than 7 days without notice, the project may be considered abandoned and terminated without refund.',
    ]
  },
  {
    title: '6 — Rights of Use',
    items: [
      'The artist retains all copyright and may display the artwork in portfolios and social media unless confidentiality is requested.',
      'The client has the right to personal and commercial use of the artwork.',
      'Total exclusivity or transfer of rights must be agreed upon in advance and in writing.',
      'Purchase does not grant rights to the source file or editing rights.',
    ]
  },
  {
    title: '7 — Payment',
    items: [
      'Payments accepted via: PayPal (international), Wise (international), or Pix.',
      'Payment should only be made after the draft has been approved.',
      'Orders not paid within 48 hours after invoicing may be canceled.',
      'Prices are set in USD and may vary depending on complexity and deadlines.',
      'Chargebacks after work has begun are not accepted.',
    ]
  },
  {
    title: '8 — Cancellations & Refunds',
    items: [
      'The customer may cancel before work begins and receive a full refund.',
      'If cancellation occurs after work has begun, the artist retains 30% of the amount.',
      'After delivery of the sketch, there will be no refund.',
      'If the artist is unable to complete the work due to force majeure, the customer receives a full refund.',
    ]
  },
  {
    title: '9 — Confidentiality',
    items: [
      'Personal or contact information exchanged is confidential and will not be shared without authorization.',
      'The client may request complete confidentiality for an additional fee.',
      'If no such request is made, the artist may display the artwork within 30 days of delivery.',
    ]
  },
  {
    title: '10 — Acceptance of the Agreement',
    items: [
      'By placing an order, the customer declares they are aware of and agree to all terms herein.',
      'This agreement comes into effect from the first communication (message, form, or payment).',
      'The client is over 18 years old or has a legal guardian who can make this agreement on their behalf.',
    ]
  },
]

function TosPage() {
  const navigate = useNavigate()

  return (
    <div className="tos-page">
      <button className="tos-back" onClick={() => navigate('/')}>Back</button>
      <h1 className="tos-title">Terms of Service</h1>
      <p className="tos-subtitle">Please read carefully before placing an order.</p>

      <div className="tos-sections">
        {sections.map((section, i) => {
          const name = section.title.split(' — ')[1] || section.title
          return (
            <div key={i} className="tos-section">
              <h2 className="tos-section-title">
                <span className="tos-num">{String(i + 1).padStart(2, '0')}</span>
                {name}
              </h2>
              <ul className="tos-list">
                {section.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      <div className="tos-sign">
        <p>Ready to commission?</p>
        <div className="tos-sign-buttons">
          <a href="https://forms.gle/xEzpdD53bQWxVXAE6" target="_blank" rel="noreferrer" className="tos-btn">
            Sign Agreement (PT-BR)
          </a>
          <a href="https://forms.gle/NTSsAXuvMmpjzW1z6" target="_blank" rel="noreferrer" className="tos-btn">
            Sign Agreement (EN)
          </a>
           <button className="tos-back" onClick={() => navigate('/')}>Back</button>
        </div>
      </div>
    </div>
  )
}

export default TosPage