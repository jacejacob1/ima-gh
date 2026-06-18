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

// Returns the configured admin recipient numbers as a clean E.164-digit array.
// Supports a comma/space/newline-separated list in WHATSAPP_ADMIN_NUMBERS
// (for all 6 admins) and falls back to the legacy single WHATSAPP_ADMIN_NUMBER.
function getAdminNumbers() {
    const raw = process.env.WHATSAPP_ADMIN_NUMBERS || process.env.WHATSAPP_ADMIN_NUMBER || '';
    return Array.from(
        new Set(
            raw
                .split(/[\s,;]+/)
                .map((num) => num.replace(/\D/g, ''))
                .filter((num) => num.length >= 10)
        )
    );
}

async function sendWhatsAppText(url, accessToken, toPhone, body) {
    const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: toPhone,
        type: 'text',
        text: { preview_url: false, body },
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`WhatsApp Admin error (${toPhone}):`, errorText);
        return false;
    }
    return true;
}

export async function sendAdminWhatsAppAlert(booking) {
    const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
    const adminNumbers = getAdminNumbers();

    if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN || adminNumbers.length === 0) {
        return { delivered: false, reason: 'Missing WhatsApp config or admin numbers' };
    }

    const url = `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const textMessage = `*New Booking Alert*\n\nID: ${booking.id}\nGuest: ${booking.guestName}\nPhone: ${booking.guestPhone}\nReferral Dr: ${booking.referralDoctor || 'N/A'}\nSpace: ${booking.selectedSpaceLabel}\nCheckin: ${new Date(booking.checkinDateTime).toLocaleString()}\nCheckout: ${new Date(booking.checkoutDateTime).toLocaleString()}\nAmount: INR ${booking.totalAmount}\nPayment: ${booking.paymentMethod} (${booking.paymentStatus})`;

    // Send to every admin in parallel; one failure must not block the others.
    const results = await Promise.allSettled(
        adminNumbers.map((adminPhone) =>
            sendWhatsAppText(url, WHATSAPP_ACCESS_TOKEN, adminPhone, textMessage).catch((error) => {
                console.error('WhatsApp network error:', error);
                return false;
            })
        )
    );

    const deliveredCount = results.filter(
        (result) => result.status === 'fulfilled' && result.value === true
    ).length;

    return {
        delivered: deliveredCount > 0,
        deliveredCount,
        totalAdmins: adminNumbers.length,
    };
}
