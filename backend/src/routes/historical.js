import express from 'express';
import { sendMail } from '../../utils/mailer.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { startDate, endDate, startTime, endTime, params, locations, requested } = req.body;
    const to = process.env.HISTORICAL_REQUEST_RECIPIENT;
    const subject = 'New Historical Data Request Submitted';
    const text = `A new historical data request has been submitted.\n\nDate & Time Range:\n  Start: ${startDate} ${startTime}\n  End: ${endDate} ${endTime}\n\nWeather Parameters:\n  - ${params.join(', ')}\n\nCampus Locations:\n  - ${locations.join(', ')}\n\nDate Requested: ${requested}\n`;
    const html = `<p>A new historical data request has been submitted.</p><ul><li><b>Date & Time Range:</b> ${startDate} ${startTime} to ${endDate} ${endTime}</li><li><b>Weather Parameters:</b> ${params.join(', ')}</li><li><b>Campus Locations:</b> ${locations.join(', ')}</li><li><b>Date Requested:</b> ${requested}</li></ul>`;
    await sendMail({ to, subject, text, html });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
