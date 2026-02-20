export function calculateStats(books) {
    const total = books.length;
    const totalPages = books.reduce((sum,b)=>sum + Number(b.pages),0);

    const tags = {};
    books.forEach(b => tags[b.tag] = (tags[b.tag]||0)+1);

    const topTag = Object.keys(tags).sort((a,b)=>tags[b]-tags[a])[0] || "None";

    return { total, totalPages, topTag };
}