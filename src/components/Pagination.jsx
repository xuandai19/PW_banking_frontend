import React from "react";

function getPageItems(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const items = [1];
    if (current > 4) items.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) items.push(i);
    if (current < total - 3) items.push("...");
    items.push(total);
    return items;
}

export default function Pagination({ page, pageSize = 10, total, onPageChange }) {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    if (pages <= 1) return null;
    const items = getPageItems(page, pages);
    const from = total ? (page - 1) * pageSize + 1 : 0;
    const to = Math.min(page * pageSize, total);
    return <div className="pagination-wrap">
        <div className="pagination-info">Hiển thị <strong>{from}-{to}</strong> trên <strong>{total}</strong></div>
        <div className="pagination">
            <button className="pagination-arrow" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Trang trước">‹</button>
            {items.map((item, i) => item === "..." ? <span className="pagination-ellipsis" key={`e-${i}`}>…</span> : <button key={item} className={item === page ? "active" : ""} onClick={() => onPageChange(item)}>{item}</button>)}
            <button className="pagination-arrow" disabled={page >= pages} onClick={() => onPageChange(page + 1)} aria-label="Trang sau">›</button>
        </div>
        <div className="pagination-page-size">10 / trang</div>
    </div>;
}
