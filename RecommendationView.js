class RecommendationView {
    constructor(dom_container_id) {
        let container = document.getElementById(dom_container_id);
        this.container_id = dom_container_id;
        this.var_to_color = {v0: '#a6cee3', v1: '#6baed6', v2: '#b2df8a', v3: '#74c476', v4: '#fb9a99', v5: '#fb6a4a',
            v6: '#fdbf6f', v7: '#ff7f00', v8: '#cab2d6', v9: '#807dba'};
        container.innerHTML = `
        <div style="position: relative; display: flex; height: ${window.innerHeight} px;">
            <div class="bg-white border rounded-1" id="basic-container" style="flex: 33%; padding: 10px; font-size: 13px; height: ${window.innerHeight} px; margin: 10px">
            <div class="bg-white border rounded-1" id="variables-options" style="height: 300px; width: 100%; margin: 5px; padding: 5px; overflow-y: scroll;">
                <table class="table table-borderless" id="variableTable">
                <thead>
                  <tr>
                    <th scope="col">VID</th>
                    <th scope="col">Variable Name</th>
                    <th scope="col">Include</th>
                  </tr>
                </thead>
                <tbody>
                  
                </tbody>
              </table>
            </div>
            <div class="bg-white border rounded-1" id="proxy-constructor" style="height: auto; width: 100%; margin: 5px; padding: 5px">
                <b>Proxy Construction</b> <div id="variable-selected"></div>
            </div>
            <div class="bg-white border rounded-1" id="proxy-result" style="height: auto; width: 100%; margin: 5px; padding: 5px">
                <b>Modeling Result</b> <div id="proxy-result-detail"></div>
            </div>
            <div class="bg-white border rounded-1" id="proxy-save" style="height: 200px; width: 100%; margin: 5px; padding: 5px; overflow: scroll;">
                <b>Saved Proxies</b> <div id="proxy-saved"></div>
            </div>
        </div>
            <div class="bg-white border rounded-1" id="recommendation-container" style="overflow: scroll; width: 66%; font-size: 13px; height: ${window.innerHeight} px; margin: 10px; padding-left: 20px;">
            <div id="recommendation-list" style="height: 650px; font-size: 13px;"></div>
            <div class="btn-toolbar" role="toolbar" aria-label="Toolbar with button groups" style="display: flex; justify-content: center; margin: 10px;">
              <div id="page-btn" class="btn-group me-2" role="group" aria-label="First group">
                <button type="button" class="btn btn-outline-primary active" id="page-1">1</button>
                <button type="button" class="btn btn-outline-primary" id="page-2">2</button>
                <button type="button" class="btn btn-outline-primary" id="page-3">3</button>
                <button type="button" class="btn btn-outline-primary" id="page-4">4</button>
                <button type="button" class="btn btn-outline-primary" id="page-5">5</button>
                <button type="button" class="btn btn-outline-primary" id="page-6">6</button>
              </div>
            </div>
            </div>
        </div>
        `;




    }

    init(data, topic, condition, pid) {
        let self = this;
        this.data = data;
        this.pid = pid;
        this.condition = condition;
        this.topic = topic;
        this.save_model_list = [];
        if (topic === 'mental') {
            this.variables_names = mental_variables;
            this.variables_short = mental_variables_short;
        }
        else if (topic === 'academic') {
            this.variables_names = academic_variables;
            this.variables_short = academic_variables_short;
        }
        else {
            this.variables_names = social_variables;
            this.variables_short = social_variables_short;
        }
        const tableBody = document.querySelector('#variableTable tbody');
        let vids = ['v0', 'v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9'];
        vids.forEach(function (vid) {
            const newRow = document.createElement('tr');
            newRow.style.backgroundColor = self.var_to_color[vid]; // Cycle through colors
            let vname = self.variables_names[vid];
            // Create cells for the variable name and checkbox
            newRow.innerHTML = `
              <td>${vid}</td>
              <td>${vname}</td>
              <td>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="checkbox-${vid}">
                </div>
              </td>
            `;

            // Append the new row to the table body
            tableBody.appendChild(newRow);
        });

        const checkboxes = document.getElementById('variableTable').querySelectorAll('input[type="checkbox"]');
        const proxy_construction_view = document.getElementById('variable-selected');
        function vequal(vlist1, vlist2) {
            if (vlist1.length !== vlist2.length) return false;

            // Sort the arrays and compare each element
            const sortedArr1 = vlist1.slice().sort();
            const sortedArr2 = vlist2.slice().sort();

            return sortedArr1.every((value, index) => value === sortedArr2[index]);
        }
        function searchResult(vlist) {
            let result = null;
            self.data.data.forEach((obj) => {
                if (vequal(obj.variables, vlist)) result = obj;
            });
            return result;
        }
        function updateCheckboxStates() {
            // Count selected checkboxes
            const selectedCount = Array.from(checkboxes).filter(checkbox => checkbox.checked).length;
            let proxy_construction_html = '';
            let cnt = 0
            // Enable or disable checkboxes based on selected count
            checkboxes.forEach((checkbox, i) => {
                if (checkbox.checked) {
                    let vid = checkbox.id.slice(9);
                    if (cnt > 0) proxy_construction_html += '<span> OR <span>';
                    proxy_construction_html += `<span style="background-color: ${self.var_to_color[vid]}; border-radius: 5px; padding: 2px;">${self.variables_names[vid]}</span>`;
                    cnt += 1;
                }
                if (selectedCount >= 2) {
                    // Disable unchecked checkboxes if the limit is reached
                    if (!checkbox.checked) {
                        checkbox.disabled = true;
                    }
                } else {
                    // Enable all checkboxes if below the limit
                    checkbox.disabled = false;
                }
            });
            proxy_construction_view.innerHTML = proxy_construction_html;
            if (selectedCount > 0) {
                proxy_construction_view.innerHTML = proxy_construction_html + `<div><button type="button" class="btn btn-outline-primary btn-sm">Train</button></div>`;

                proxy_construction_view.querySelector('button').addEventListener('click', function (e) {
                    let selected_vele = Array.from(checkboxes).filter(checkbox => checkbox.checked);
                    let selected_vlist = selected_vele.map(ele => ele.id.slice(9));
                    let modeling_result = searchResult(selected_vlist);
                    let args = {
                        'type': 'train', 'problem': modeling_result
                    };
                    self.save_action(args);
                    self.render_modeling_result(modeling_result);
                });

            }

        }

        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updateCheckboxStates);
        });

        if (self.condition !== 'baseline') {
            this.display_recommendation(1);

            let pagebtns = document.querySelector('#page-btn').querySelectorAll('button');
            pagebtns.forEach((btn) => {
                btn.addEventListener('click', function (e) {
                    let pageid = btn.textContent;
                    let args = {'type': 'new_page', 'pageid': pageid};
                    self.save_action(args);
                    self.display_recommendation(pageid);
                    pagebtns.forEach((ele) => {ele.classList.remove('active')});
                    btn.classList.add('active');

                })
            })
            this.context_menu = d3.select("#" + this.container_id)
                .append("div")
                .attr('id', 'context-menu');

        }
        else {
            document.getElementById('recommendation-container').classList.add('hidden');
        }

        document.getElementById('recommendation-container').addEventListener('mouseenter',function () {
            let args = {'type': 'enter_recommend'};
            self.save_action(args);
        })
        document.getElementById('recommendation-container').addEventListener('mouseleave',function () {
            let args = {'type': 'leave_recommend'};
            self.save_action(args);
        })

        document.getElementById('variables-options').addEventListener('mouseenter',function () {
            let args = {'type': 'enter_variables'};
            self.save_action(args);
        })
        document.getElementById('variables-options').addEventListener('mouseleave',function () {
            let args = {'type': 'leave_variables'};
            self.save_action(args);
        })

        document.getElementById('proxy-result').addEventListener('mouseenter',function () {
            let args = {'type': 'enter_result'};
            self.save_action(args);
        })
        document.getElementById('proxy-result').addEventListener('mouseleave',function () {
            let args = {'type': 'leave_result'};
            self.save_action(args);
        })

        document.getElementById('proxy-save').addEventListener('mouseenter',function () {
            let args = {'type': 'enter_save'};
            self.save_action(args);
        })
        document.getElementById('proxy-save').addEventListener('mouseleave',function () {
            let args = {'type': 'leave_save'};
            self.save_action(args);
        })


    }

    display_recommendation(page) {
        let recommend_list_container = document.getElementById('recommendation-list');
        let self = this;
        let itemsPerPage = 10;
        let start = (page - 1) * itemsPerPage;
        let end = start + itemsPerPage;
        let options = self.data.data.slice(start, end);
        let maxPerf = Math.max(...self.data.data.map(d => d.performance));
        let maxRel = Math.max(...self.data.data.map(d => d.relevance));
        recommend_list_container.innerHTML = `
        <table class="table table-borderless table-hover" id="recommendationTable">
            <thead>
              <tr>
                <th class="rotate" scope="col">${self.variables_short.v0}</th> 
                <th class="rotate" scope="col">${self.variables_short.v1}</th> 
                <th class="rotate" scope="col">${self.variables_short.v2}</th> 
                <th class="rotate" scope="col">${self.variables_short.v3}</th>
                <th class="rotate" scope="col">${self.variables_short.v4}</th> 
                <th class="rotate" scope="col">${self.variables_short.v5}</th> 
                <th class="rotate" scope="col">${self.variables_short.v6}</th> 
                <th class="rotate" scope="col">${self.variables_short.v7}</th>
                <th class="rotate" scope="col">${self.variables_short.v8}</th>
                <th class="rotate" scope="col">${self.variables_short.v9}</th>
              </tr>
            </thead>
            <tbody>
              
            </tbody>
        </table>
        `;
        let recommend_header = document.querySelector('#recommendationTable tr');
        if (self.condition === 'performance') {
            let new_header = document.createElement('th');
            new_header.innerHTML = `Sensitivity`;
            new_header.scope = "col";
            recommend_header.appendChild(new_header);
        }
        else if (self.condition === 'relevance') {
            let new_header = document.createElement('th');
            new_header.innerHTML = `Relevance`;
            new_header.scope = "col";
            recommend_header.appendChild(new_header);
        }
        else {
            let header_front = document.createElement('th');
            header_front.innerHTML = ``;
            header_front.scope = "col";
            recommend_header.appendChild(header_front);
            let header_rel = document.createElement('th');
            header_rel.innerHTML = `Relevance`;
            header_rel.scope = "col";
            recommend_header.appendChild(header_rel);
            let header_perf = document.createElement('th');
            header_perf.innerHTML = `Sensitivity`;
            header_perf.scope = "col";
            recommend_header.appendChild(header_perf);
        }
        let tableBody = document.querySelector('#recommendationTable tbody');


        options.forEach((obj) => {
            let newRow = document.createElement('tr');
            let row_html = '';
            let vids = ['v0', 'v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9'];
            vids.forEach((vid) => {
                if (obj.variables.includes(vid)) row_html += `<td><div class="circle" style="background-color: ${self.var_to_color[vid]};"></div></td>`;
                else row_html += `<td><div class="circle" style="background-color: #c7c7c7;"></div></td>`;
            });
            newRow.innerHTML = row_html;
            // row_html += `<td>${obj.performance}</td> <td>${obj.relevance}</td>`;
            // newRow.innerHTML = row_html;


            const barPerf = document.createElement("td");
            const bar1 = document.createElement("div");
            bar1.innerHTML = obj.performance.toFixed(2);
            bar1.style.width = `${(obj.performance / maxPerf) * 100}%`;  // Scale width relative to max value
            bar1.style.height = "15px";  // Adjust bar height as needed
            bar1.style.backgroundColor = "#c7c7c7";
            barPerf.appendChild(bar1);

            const barRel = document.createElement("td");
            const bar2 = document.createElement("div");
            bar2.innerHTML = obj.relevance.toFixed(2);
            bar2.style.width = `${(obj.relevance / maxRel) * 100}%`;  // Scale width relative to max value
            bar2.style.height = "15px";  // Adjust bar height as needed
            bar2.style.backgroundColor = "#c7c7c7";
            barRel.appendChild(bar2);


            const barStars = document.createElement('td');
            const stars = document.createElement('div');
            stars.classList.add('star-rating');
            stars.innerHTML = `<span class="star" data-rating="1">★</span>
                <span class="star" data-rating="2">★</span>
                <span class="star" data-rating="3">★</span>
                <span class="star" data-rating="4">★</span>
                <span class="star" data-rating="5">★</span>`;
            stars.querySelectorAll(".star-rating .star").forEach((star) => {
                star.classList.toggle("filled", star.dataset.rating <= obj.stars);
            });
            barStars.appendChild(stars);


            if (self.condition === 'performance') {
                newRow.appendChild(barPerf);
            }
            else if (self.condition === 'relevance') {
                newRow.appendChild(barRel);
            }
            else {
                newRow.appendChild(barStars);
                newRow.appendChild(barRel);
                newRow.appendChild(barPerf);
            }

            tableBody.appendChild(newRow);

            newRow.addEventListener('click', function () {
                self.render_modeling_result(obj);
                let args = {
                    'type': 'select', 'problem': obj
                }
                self.save_action(args);
            })
            newRow.addEventListener('mouseenter', function (e) {
                let row_box = newRow.getBoundingClientRect();
                let parent_box = document.getElementById('recommendationTable').getBoundingClientRect();
                self.context_menu.style('left', parent_box.left + 'px').style('top', row_box.bottom + 'px');
                let result_inner_html = '';
                obj.variables.forEach((variable, i) => {
                    if (i > 0) result_inner_html += '<span> OR <span>';
                    result_inner_html += `<span style="background-color: ${self.var_to_color[variable]}; border-radius: 5px; padding: 2px;">${self.variables_names[variable]}</span>`;
                });
                self.context_menu.html(result_inner_html)
                self.context_menu.classed('visible',true);
            })
            newRow.addEventListener('mouseleave', function (e) {
                self.context_menu.classed('visible',false);
            })
        })

        // const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
        // const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
    }

    render_modeling_result(obj) {
        let self = this;
        let modeling_result_view = document.querySelector('#proxy-result-detail');
        let result_inner_html = '';
        obj.variables.forEach((variable, i) => {
            if (i > 0) result_inner_html += '<span> OR <span>';
            result_inner_html += `<span style="background-color: ${self.var_to_color[variable]}; border-radius: 5px; padding: 2px;">${self.variables_names[variable]}</span>`;
        });
        result_inner_html += `<div><span>Performance: ${obj.performance.toFixed(2)}</span> <span>Relevance: ${obj.relevance.toFixed(2)}</span></div>`;
        let result_inner_html_final = result_inner_html + `<button id="save-model" type="button" class="btn btn-outline-primary btn-sm">Save</button>`
        modeling_result_view.innerHTML = result_inner_html_final;
        modeling_result_view.querySelector('#save-model').addEventListener('click', (e) => {
            let save_model = document.createElement('div');
            save_model.classList.add('save-model-item');
            save_model.style.display = 'flex';
            save_model.style.borderBottomColor = 'lightgray';
            save_model.style.borderBottomWidth = '1px';
            save_model.innerHTML = `<div style="flex: 6%;"><button type="button" class="btn-close" aria-label="Close"></button></div>
                <div style="flex: 94%;">${result_inner_html}</div>
            `;
            document.getElementById('proxy-saved').appendChild(save_model);
            self.save_model_list.push(obj);
            save_model.querySelector('button').addEventListener('click', (e) => {
                let idx = self.save_model_list.indexOf(obj)
                delete self.save_model_list[idx];
                // console.log(self.save_model_list);
                let args = {
                    'type': 'remove_save', 'saved_model': self.save_model_list
                };
                self.save_action(args);
                save_model.remove();
            })
            // self.manage_saved_proxies();
            let args = {
                'type': 'save', 'saved_model': self.save_model_list
            };
            self.save_action(args);
            modeling_result_view.innerHTML = '';
        })
    }

    get_time_string(){
        var today = new Date();
        var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        var dateTime = date+' '+time;
        return dateTime
    }

    save_action(args) {
        // console.log(args);
        let time = this.get_time_string();
        // console.log(args);
        args['time'] = time;
        // console.log(args);
        let data = {"id": this.pid, "json": args, "condition": this.condition, "topic": this.topic};
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                // Typical action to be performed when the document is ready:
                // document.getElementById("demo").innerHTML = xhttp.responseText;
                let data = JSON.parse(xhttp.responseText);

            }
        };
        xhttp.open("POST", "http://127.0.0.1:8985/save_actions", true);
        xhttp.setRequestHeader("Access-Control-Allow-Origin", "*");
        xhttp.setRequestHeader("Content-Type", "application/json");
        xhttp.send(JSON.stringify(data),);
        // if (this.action_log) {
        //     // console.log(args)
        //
        // }
    }

}