export async function sendGuestWhatsAppConfirmation(booking) {
    const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN || !booking.guestPhone) {
        return { delivered: false, reason: 'Missing WhatsApp config or guest phone' };
    }

    const url = `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    // Clean phone number (expecting e.g., '919876543210')
    const toPhone = booking.guestPhone.replace(/\D/g, '');

    const payload = {
        messaging_product: 'whatsapp',
        to: toPhone,
        type: 'template',
        template: {
            name: process.env.WHATSAPP_GUEST_TEMPLATE_NAME || 'booking_confirmation', // Update with actual approved template name
            language: {
                code: 'en',
            },
            components: [
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: booking.guestName }, // {{1}}
                        { type: 'text', text: booking.selectedSpaceLabel }, // {{2}}
                        { type: 'text', text: new Date(booking.checkinDateTime).toLocaleString() }, // {{3}}
                        { type: 'text', text: new Date(booking.checkoutDateTime).toLocaleString() }, // {{4}}
                        { type: 'text', text: booking.id }, // {{5}}
                    ],
                },
            ],
        },
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('WhatsApp Guest error:', errorText);
            return { delivered: false, reason: 'WhatsApp API error' };
        }
        return { delivered: true };
    } catch (error) {
        console.error('WhatsApp network error:', error);
        return { delivered: false, reason: error.message };
    }
}

export async function sendAdminWhatsAppAlert(booking) {
    const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
    const WHATSAPP_ADMIN_NUMBER = process.env.WHATSAPP_ADMIN_NUMBER;

    if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN || !WHATSAPP_ADMIN_NUMBER) {
        return { delivered: false, reason: 'Missing WhatsApp config or admin number' };
    }

    const url = `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const adminPhone = WHATSAPP_ADMIN_NUMBER.replace(/\D/g, '');

    const textMessage = `*New Booking Alert*\n\nID: ${booking.id}\nGuest: ${booking.guestName}\nPhone: ${booking.guestPhone}\nSpace: ${booking.selectedSpaceLabel}\nCheckin: ${new Date(booking.checkinDateTime).toLocaleString()}\nCheckout: ${new Date(booking.checkoutDateTime).toLocaleString()}\nAmount: INR ${booking.totalAmount}\nPayment: ${booking.paymentMethod} (${booking.paymentStatus})`;

    const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: adminPhone,
        type: 'text',
        text: {
            preview_url: false,
            body: textMessage,
        },
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('WhatsApp Admin error:', errorText);
            return { delivered: false, reason: 'WhatsApp API error' };
        }
        return { delivered: true };
    } catch (error) {
        console.error('WhatsApp network error:', error);
        return { delivered: false, reason: error.message };
    }
}
