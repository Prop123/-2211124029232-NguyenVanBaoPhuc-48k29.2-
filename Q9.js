document.addEventListener("DOMContentLoaded", () => {
    d3.csv("data.csv").then(function(data) {
        console.log("Dữ liệu đã load:", data);

        if (!data.length || !data[0]["Mã nhóm hàng"] || !data[0]["Tên nhóm hàng"] || !data[0]["Mã mặt hàng"] || !data[0]["Tên mặt hàng"] || !data[0]["Mã đơn hàng"]) {
            console.error("\u26a0\ufe0f Tên cột không đúng hoặc dữ liệu trống! Kiểm tra file CSV.");
            return;
        }

        // Tạo cột Nhóm hàng hiển thị
        const parsedData = data.map(d => {
            return {
                category: `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`,
                itemCode: d["Mã mặt hàng"],
                itemName: d["Tên mặt hàng"],
                orderID: d["Mã đơn hàng"]
            };
        });

        // Tính xác suất bán hàng
        const ordersPerItem = d3.rollups(parsedData,
            v => v.length,
            d => d.category,
            d => d.itemCode + " " + d.itemName
        );

        const totalOrdersPerCategory = d3.rollups(parsedData,
            v => new Set(v.map(d => d.orderID)).size,
            d => d.category
        );

        const dataset = ordersPerItem.map(([category, items]) => {
            const totalOrders = totalOrdersPerCategory.find(d => d[0] === category)[1];
            return {
                category,
                items: items.map(([item, count]) => ({
                    item,
                    probability: (count / totalOrders * 100).toFixed(1) 
                })).sort((a, b) => b.probability - a.probability) 
            };
        });

        // Vẽ biểu đồ
        const container = d3.select("#Q9");
        container.selectAll("svg").remove();

        const chartWidth = 350, chartHeight = 150;
        const margin = { top: 30, right: 40, bottom: 40, left: 250 };

        dataset.forEach(group => {
            const svg = container.append("svg")
                .attr("width", chartWidth + margin.left + margin.right)
                .attr("height", chartHeight + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left}, ${margin.top})`);

            svg.append("text")
                .attr("x", chartWidth / 2)
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .style("font-weight", "bold")
                .style("fill", "teal")
                .text(group.category);

            const x = d3.scaleLinear()
                .domain([0, d3.max(group.items, d => d.probability)])
                .range([0, chartWidth]);

            const y = d3.scaleBand()
                .domain(group.items.map(d => d.item))
                .range([0, chartHeight])
                .padding(0.3);

            svg.append("g")
                .call(d3.axisLeft(y).tickSize(0).tickPadding(10))
                .selectAll("text")
                .style("font-size", "12px");

            svg.append("g")
                .attr("transform", `translate(0, ${chartHeight})`)
                .call(d3.axisBottom(x).ticks(5).tickFormat(d => `${d}%`))
                .selectAll("text")
                .style("font-size", "12px");

            svg.selectAll(".bar")
                .data(group.items)
                .enter()
                .append("rect")
                .attr("x", 0)
                .attr("y", d => y(d.item))
                .attr("width", d => x(d.probability))
                .attr("height", y.bandwidth())
                .attr("fill", (d, i) => d3.schemeSet2[i % 8]);

            svg.selectAll(".label")
                .data(group.items)
                .enter()
                .append("text")
                .attr("x", d => x(d.probability) - 5)
                .attr("y", d => y(d.item) + y.bandwidth() / 2)
                .attr("text-anchor", "end")
                .attr("alignment-baseline", "middle")
                .style("font-size", "12px")
                .style("fill", "white")
                .text(d => `${d.probability}%`);
        });
    }).catch(error => console.error("\u274c Lỗi khi đọc CSV:", error));
});
