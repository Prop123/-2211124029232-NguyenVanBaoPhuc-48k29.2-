document.addEventListener("DOMContentLoaded", () => {
    d3.csv("data.csv").then(function(data) {
        console.log("Dữ liệu đã load:", data);

        if (!data.length || !data[0]["Mã nhóm hàng"] || !data[0]["Tên nhóm hàng"] || !data[0]["Mã mặt hàng"] || !data[0]["Tên mặt hàng"] || !data[0]["Mã đơn hàng"]) {
            console.error("⚠️ Tên cột không đúng hoặc dữ liệu trống! Kiểm tra file CSV.");
            return;
        }

        // Tạo cột Tháng
        data.forEach(d => {
            d["Tháng"] = "T" + d["Thời gian tạo đơn"].slice(5, 7); // Trích xuất tháng từ "Thời gian tạo đơn"
            d["Nhóm hàng"] = `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`;
            d["Mặt hàng"] = `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`;
        });

        // Tính tổng số đơn hàng theo nhóm hàng và mặt hàng
        const mhNhOrders = d3.rollup(data, v => new Set(v.map(d => d["Mã đơn hàng"]).filter(Boolean)).size, d => d["Mặt hàng"], d => d["Nhóm hàng"], d => d["Tháng"]);
        const nhOrders = d3.rollup(data, v => new Set(v.map(d => d["Mã đơn hàng"]).filter(Boolean)).size, d => d["Nhóm hàng"], d => d["Tháng"]);

        let dataset = [];
        mhNhOrders.forEach((groupData, item) => {
            groupData.forEach((monthData, group) => {
                monthData.forEach((count, month) => {
                    const total = nhOrders.get(group)?.get(month) || 1;
                    dataset.push({
                        group,
                        item,
                        month,
                        probability: (count / total) * 100
                    });
                });
            });
        });

        // Lọc nhóm hàng muốn hiển thị
        const selectedGroups = ["[BOT] Bột", "[SET] Set trà", "[THO] Trà hoa", "[TMX] Trà mix", "[TTC] Trà củ, quả sấy"];
        dataset = dataset.filter(d => selectedGroups.includes(d.group));

        // Thiết lập biểu đồ
        const container = d3.select("#Q10");
        container.selectAll("svg").remove();

        const chartWidth = 350, chartHeight = 250, margin = {top: 30, right: 30, bottom: 50, left: 60};
        const tooltip = d3.select(".tooltip");

        selectedGroups.forEach(group => {
            const groupData = dataset.filter(d => d.group === group);
            const months = Array.from(new Set(groupData.map(d => d.month))).sort();
            const items = Array.from(new Set(groupData.map(d => d.item)));

            const svg = container.append("svg")
                .attr("width", chartWidth + margin.left + margin.right)
                .attr("height", chartHeight + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            const x = d3.scaleBand().domain(months).range([0, chartWidth]).padding(0.1);
            const y = d3.scaleLinear().domain([0, d3.max(groupData, d => d.probability)]).nice().range([chartHeight, 0]);
            const color = d3.scaleOrdinal(d3.schemeCategory10).domain(items);

            // Trục X và Y
            svg.append("g").attr("transform", `translate(0,${chartHeight})`).call(d3.axisBottom(x));
            svg.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(d => d + "%"));

            // Vẽ các đường cho từng mặt hàng
            items.forEach(item => {
                const itemData = groupData.filter(d => d.item === item);
                const line = d3.line().x(d => x(d.month) + x.bandwidth() / 2).y(d => y(d.probability));

                svg.append("path")
                    .datum(itemData)
                    .attr("class", "line")
                    .attr("d", line)
                    .attr("stroke", color(item));

                svg.selectAll(".dot")
                    .data(itemData)
                    .enter()
                    .append("circle")
                    .attr("cx", d => x(d.month) + x.bandwidth() / 2)
                    .attr("cy", d => y(d.probability))
                    .attr("r", 4)
                    .attr("fill", color(item))
                    .on("mouseover", function(event, d) {
                        tooltip.style("display", "block")
                            .html(`Mặt hàng: ${d.item}<br>Tháng: ${d.month}<br>Xác suất: ${d.probability.toFixed(2)}%`)
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 20) + "px");
                    })
                    .on("mousemove", function(event) {
                        tooltip.style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 20) + "px");
                    })
                    .on("mouseout", function() {
                        tooltip.style("display", "none");
                    });
            });

            // Tiêu đề nhóm hàng
            svg.append("text")
                .attr("x", chartWidth / 2)
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .text(group);
        });
    }).catch(error => console.error("Lỗi khi đọc CSV:", error));
});
