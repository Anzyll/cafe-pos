export const formatBillToText = (order, items) => {
    const cafeName = "The Cozy Cup Cafe";
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();

    let text = `*${cafeName}*\n`;
    text += `Date: ${date} ${time}\n`;
    text += `Order #${order.id.slice(0, 6)}\n`;
    text += `Table: ${order.tableNumber}\n\n`;

    text += `*Items:*\n`;
    order.items.forEach(item => {
        text += `${item.name} x${item.qty} - ₹${item.price * item.qty}\n`;
    });

    text += `\n*Total: ₹${order.totalAmount}*\n\n`;
    text += `Thank you for visiting!`;

    return encodeURIComponent(text);
};

export const shareBillOnWhatsApp = (phone, text) => {
    const url = `https://wa.me/${phone}?text=${text}`;
    window.open(url, '_blank');
};
