document.addEventListener("DOMContentLoaded", () => {
    d3.csv("data.csv").then(function(data) {
        console.log("Dữ liệu đã load:", data);

        if (!data.length || !data[0]["Mã đơn hàng"] || !data[0]["Mã nhóm hàng"] || !data[0]["Tên nhóm hàng"]) {
            console.error("⚠️ Tên cột không đúng hoặc dữ liệu trống! Kiểm tra file CSV.");
            return;
        }

        // Tạo cột "Nhóm hàng hiển thị" bằng cách kết hợp [Mã nhóm hàng] + [Tên nhóm hàng]
        const parsedData = data.map(d => ({
            category: `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`,
            orderID: d["Mã đơn hàng"]
        }));

        // Đếm số đơn hàng duy nhất theo Nhóm hàng
        const ordersByCategory = d3.rollup(parsedData, 
            v => new Set(v.map(d => d.orderID)).size, // Đếm số đơn hàng duy nhất
            d => d.category
        );

        // Tính tổng số đơn hàng trong toàn bộ dataset
        const totalOrders = new Set(parsedData.map(d => d.orderID)).size;

        // Tính xác suất bán (số đơn hàng duy nhất của nhóm hàng / tổng đơn hàng)
        const dataset = Array.from(ordersByCategory, ([category, orderCount]) => ({
            category,
            probability: (orderCount / totalOrders) * 100  // Đổi sang phần trăm
        })).sort((a, b) => d3.descending(a.probability, b.probability));

        const margin = { top: 60, right: 50, bottom: 50, left: 300 };
        const width = 1200 - margin.left - margin.right;
        const height = dataset.length * 80;

        d3.select("#Q7").selectAll("svg").remove();

        const svg = d3.select("#Q7")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .style("font-size", "22px")
            .style("font-weight", "bold")
            .style("fill", "#009688")
            .text("Xác suất bán hàng theo Nhóm hàng");

        const y = d3.scaleBand()
            .domain(dataset.map(d => d.category))
            .range([0, height])
            .padding(0.2);

        const x = d3.scaleLinear()
            .domain([0, d3.max(dataset, d => d.probability)])
            .range([0, width]);

        // Trục Y (Danh sách nhóm hàng)
        svg.append("g")
        .call(d3.axisLeft(y).tickSize(0).tickPadding(10))
        .selectAll("text")
        .style("font-size", "16px")  // Thử tăng font chữ lớn hơn
        .style("fill", "black")
        .attr("dy", "0.3em");  // Điều chỉnh vị trí chữ để không bị lệch

        // Trục X (Phần trăm xác suất bán)
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x).ticks(5).tickFormat(d => `${d}%`))
            .selectAll("text")
            .style("font-size", "14px");

        // Thanh biểu đồ ngang
        svg.selectAll(".bar")
            .data(dataset)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("y", d => y(d.category))
            .attr("width", d => x(d.probability))
            .attr("height", y.bandwidth())
            .attr("fill", (d, i) => d3.schemeCategory10[i % 10]);

        // Nhãn phần trăm trong cột
        svg.selectAll(".label")
            .data(dataset)
            .enter()
            .append("text")
            .attr("x", d => x(d.probability) - 30)  // Căn chỉnh text sang bên phải
            .attr("y", d => y(d.category) + y.bandwidth() / 2 + 5)
            .attr("text-anchor", "end")
            .style("font-size", "14px")
            .style("fill", "white")
            .style("font-weight", "bold")
            .text(d => `${d3.format(".1f")(d.probability)}%`);

    }).catch(error => console.error("❌ Lỗi khi đọc CSV:", error));
});
