// lib/whatsapp.js
// lib/whatsapp.js
export const formatBillToText = (order, tableNumber) => {
  const cafeName = "Baadal Bistro";
  const dateObj = new Date();
  const date = dateObj.toLocaleDateString();
  const time = dateObj.toLocaleTimeString();

  let text = `*${cafeName}*\n`;
  text += `📅 Date: ${date} ${time}\n`;
  text += `📋 Order #${order.id.slice(0, 6)}\n`;
  text += `🪑 Table: ${tableNumber}\n\n`;

  text += `*Items:*\n`;
  order.items.forEach((item) => {
    text += `${item.qty} × ${item.name} — ₹${item.price * item.qty}\n`;
  });

  text += `\n─────────────────\n`;
  text += `Subtotal: ₹${order.totalAmount}\n`;

  // ✅ Include discount only if applied
  if (order.offerPercent > 0) {
    text += `Discount (${order.offerPercent}%): -₹${order.discountAmount}\n`;
  }

  text += `*Total Payable: ₹${order.finalAmount ?? order.totalAmount}*\n\n`;

  text += `Thank you for visiting! ☕\n`;
  text += `Hope to see you again soon!`;

  return text;
};


export const shareBillOnWhatsApp = (phone, text) => {
    // Clean phone number (remove +, spaces, etc.)
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Validate phone number
    if (cleanPhone.length < 10) {
        alert("Invalid phone number. Please enter a valid number with country code.");
        return;
    }
    
    // Use WhatsApp API URL
    const encodedText = encodeURIComponent(text);
    const url = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    
    // Open in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
    
    // Alternative for web.whatsapp.com (for desktop users)
    // const webUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}&app_absent=1`;
    // window.open(webUrl, '_blank', 'noopener,noreferrer');
};