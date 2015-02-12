(function() {

    var apiDescription = null;
    var currentId = 0;
    var descCache = {};
    var templates = {};

    function nextId(desc) {
        currentId++;

        desc.id = currentId.toString();
        descCache[desc.id] = desc;
    }

    function getComplexType(desc) {
        var typeName = desc.TypeName || desc.ValueTypeName;

        var found = apiDescription.ComplexTypes.filter(function(t) {
            return t.Name == typeName;
        });

        if (found.length) {
            return found[0];
        }
        return null;
    }

    function clone(thing) {
        return JSON.parse(JSON.stringify(thing));
    }

    //the name of the api is the last segment of the url. 
    var apiId = window.location.pathname.split('/').pop();

    //go get the meta data for this API
    getJson("/WebApiTestClient.axd?ApiName=" + apiId, getReadyToUseTestClient);


    //callback from getting meta data.
    function getReadyToUseTestClient(data) {
        window.apiDescription = apiDescription = data;
        window.descCache = descCache;

        dom.el("link", {"href": "/Content/WebApiTestClient/styles.css","rel":"stylesheet","type": "text/css"}, document.head);
        dom.el("script", { "src": "//cdnjs.cloudflare.com/ajax/libs/handlebars.js/2.0.0/handlebars.min.js", "type": "text/javascript" }, document.head);
        makeActivatorButton();
    }

    //take the metadata and extend the objects a bit to help out with the handlebars templates
    function setUpApiDescForUi() {
        apiDescription.Headers = [];

        apiDescription.QueryParameters.forEach(function(p) {
            nextId(p);
        });
        apiDescription.RouteParameters.forEach(function(p) {
            nextId(p);
        });

        if (apiDescription.BodyParameter) {
            if (apiDescription.BodyParameter.IsDictionary) {
                setUpDictionary(apiDescription.BodyParameter);
            } else {
                setUpProperties(apiDescription.BodyParameter);
            }
        }
    }


    function setUpDictionary(desc) {
        if (!desc.IsSimple) {
            return null;
        }
        if (!desc.id) {
            nextId(desc);
        }

        var item = {
            Key: { TypeName: desc.KeyTypeName },
            Value: {TypeName: desc.ValueTypeName }
        }

        nextId(item.Key);
        nextId(item.Value);

        if (!desc.Items) {
            desc.Items = [];
        }

        desc.Items.push(item);

        return item;
    }

    function addComplexItemToList(parent, ct) {
        var item = clone(ct);
        nextId(item);
        if (!parent.Items) {
            parent.Items = [];
        }
        parent.Items.push(item);
        item.Properties.forEach(function (p) {
            nextId(p);
        });
        return item;
    }

    function setUpProperties(desc) {
        if (!desc.id) {
            nextId(desc);
        }
            
        var ct = getComplexType(desc);

        
        if (ct) {
            if (desc.IsList) {
                addComplexItemToList(desc,ct);

            } else {
                desc.Properties = clone(ct.Properties);
                desc.Properties.forEach(function(p) {
                    nextId(p);
                });
            }
        }
        
    }

    //put the button on the screen that the user will click to activate the test client.
    function makeActivatorButton() {
        var a = dom.el("A", {'class':"watc-activator","href": "#test"}, document.body);

        dom.text(a, "Test this API");

        a.addEventListener("click", function (ev) {
            ev.preventDefault();
            getTemplate(showUi);
            a.parentNode.removeChild(a);

        });

    }


    //callback from the ajax call that gets the template HTML
    function showUi() {
        configHandlebars();
        setUpApiDescForUi();

        var html = templates['container'](apiDescription);
        dom.html(html, document.body);

        window.scroll(0, document.body.scrollHeight);

        var panel = dom.gid('watc-panel');
        panel.addEventListener("click", clickHandler);

    }


    //handles any click event from within the panel that contains the test client
    function clickHandler(ev) {
        var cmd = ev.target.getAttribute("data-cmd");
        if (cmd && commands[cmd]) {
            ev.preventDefault();
            commands[cmd](ev.target);
        }
    }

    //set up handlebars.  
    function configHandlebars() {

        //Get all the templates, compile each one, cache the compiled template and register it as a partial
        [].forEach.call(document.querySelectorAll("script[type='text/html']"), function(t) {

            var name = t.getAttribute("id").replace("tpl-watc-", "");

            templates[name] = Handlebars.compile(t.innerHTML);
            Handlebars.registerPartial(name, templates[name]);
        });

    }


    function getSimpleValue(desc) {
        var input = document.querySelectorAll("input[name=input-" + desc.id + "]");

        var val = [].map.call(input,function (i) {
            return i.value;
        });
        if (desc.TypeName == "System.DateTime") {
            val = val.map(function(v) {
                return new Date(v);
            });
        }
        else if (desc.TypeName == "System.Int32") {
            val = val.map(function (v) {
                return parseInt(v);
            });
        }
        else if (desc.TypeName == "System.Boolean") {
            val = val.map(function (v) {
                return v.toLowerCase() == 'true';
            });
        }

        if (desc.IsList) {
            return val;
        }
        return val[0];
    }

    function getComplexObjectValue(desc) {
        if (desc.Properties) {
            var obj = {};
            desc.Properties.forEach(function(p) {
                obj[p.Name] = getValue(p);
            });

            return obj;
        }
        return null;
    }

    function getComplexObjectListValue(desc) {
        var list = desc.Items.map(function(i) {
            return getComplexObjectValue(i);

        });
        return list;
    }

    function getDictionaryValue(desc) {
        if (desc.Items && desc.Items.length) {
            var obj = {};
            desc.Items.forEach(function(i) {
                obj[getSimpleValue(i.Key)] = getSimpleValue(i.Value);
            });

            return obj;
        }
        return null;
    }


    function getValue(desc) {
        if (desc.IsDictionary) {
            return getDictionaryValue(desc);
        } else if (desc.IsSimple) {
                return getSimpleValue(desc);
        }else if (desc.IsList) {
            return getComplexObjectListValue(desc);

        } else {
            return getComplexObjectValue(desc);
        }
    }

    function buildUrl() {
        var url = apiDescription.Route;

        apiDescription.RouteParameters.forEach(function (p) {
            var v = getValue(p);
            
            url = url.replace("{" + p.Name + "}", v);
        });

        apiDescription.QueryParameters.forEach(function(p,i) {
            if (i == 0) {
                url = url + "?";
            } else {
                url = url + '&';
            }
            var v = getValue(p);
            if (v && v.toISOString) {
                v = v.toISOString();
            }
            if (p.IsList) {
                v.forEach(function (vi, vii) {
                    if (vi && vi.toISOString) {
                        vi = vi.toISOString();
                    }

                    if (vii > 0) {
                        url = url + "&";
                    }
                    url = url + p.Name + "[" + vii + "]=" + encodeURIComponent(vi);
                });
            } else {
                url = url + p.Name + "=" + encodeURIComponent(v);
            }

        });

        return "/" + url;
    }

    function setHeaders(xhr) {
        apiDescription.Headers.forEach(function(h) {
            xhr.setRequestHeader(getSimpleValue(h.Name), getSimpleValue(h.Value));
        });

        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Accept", "application/json");
    }

    function getBody() {
        if (apiDescription.BodyParameter) {
            var b = getValue(apiDescription.BodyParameter);;
            return JSON.stringify(b);
        }
    }


    //commands that respond to various buttons that could be clicked by the user.  functions correspond to data-cmd attribute values in links and buttons in the templates.  
    var commands = {
        sendRequest: function() {

            var xhr = new XMLHttpRequest();
            xhr.addEventListener("load", function () {
                var formattedResponse = xhr.status + " - " + xhr.statusText + "\n";
                formattedResponse += xhr.getAllResponseHeaders() + "\n";

                try {
                    var data = JSON.parse(xhr.response);
                    formattedResponse += JSON.stringify(data, null, 5);
                } catch (e) {
                    formattedResponse += xhr.response;
                }


                dom.text('response-data', formattedResponse, true);

            });
            xhr.open(apiDescription.Method, buildUrl());

            setHeaders(xhr);

            xhr.send(getBody());

        },

        headerAdd: function () {
            var container = dom.gid('headers-container');

            var item = {
                Name: { TypeName: "System.String" },
                Value: {TypeName: "System.String" }
            }
            nextId(item);
            nextId(item.Name);
            nextId(item.Value);
            apiDescription.Headers.push(item);

            var html = templates['header-item'](item);
            dom.html(html, container);
        },

        headerRemove:function(el) {
            var id = el.getAttribute("data-id");
            var elem = dom.gid('header-' + id);

            elem.parentNode.removeChild(elem);

            apiDescription.Headers.every(function(h, i) {
                if (h.id == id) {
                    apiDescription.Headers.splice(i, 1);
                    return false;
                }
                return true;
            });
        },

        inputListRemove:function(el) {
            var id = el.getAttribute("data-id");
            var container = dom.gid('input-list-' + id);
            var inputs = dom.childs(container, 'span');
            if (inputs.length) {
                container.removeChild(inputs[inputs.length - 1]);
            }
        },

        inputListAdd:function(el) {
            var id = el.getAttribute("data-id");
            var desc = descCache[id];
            var html = templates['simple-input'](desc);

            var container = dom.gid('input-list-' + id);

            dom.html(html, container);

        },

        complexListAdd:function(el) {

            var id = el.getAttribute("data-id");

            var container = dom.gid('list-container-' + id);
            var desc = descCache[id];
            var item = getComplexType(desc);
            item = addComplexItemToList(desc, item);
            var html = templates['complex-object-list-item'](item);
            dom.html(html, container);

        },

        complexListRemove: function (el) {
            var id = el.getAttribute("data-id");

            var container = dom.gid('list-container-' + id);
            var desc = descCache[id];

            var items = dom.childs(container, 'span');

            if (items.length != desc.Items.length) {
                throw "complex list UI and model don't match: " + id;
            }

            if (items.length) {
                container.removeChild(items.pop());
                desc.Items.pop();
            }

        },

        dictionaryRemove:function(el) {
            var id = el.getAttribute("data-id");
            var desc = descCache[id];
            var container = dom.gid('dictionary-' + id);
            var items = dom.childs(container, 'div');

            if (items.length != desc.Items.length) {
                throw "complex list UI and model don't match: " + id;
            }

            if (items.length) {
                container.removeChild(items.pop());
                desc.Items.pop();
            }

        },

        dictionaryAdd: function (el) {
            var id = el.getAttribute("data-id");
            var desc = descCache[id];
            var item = setUpDictionary(desc);
            var container = dom.gid('dictionary-' + id);
            var html = templates['dictionary-item'](item);
            dom.html(html, container);

        },

        complexObjectSetValue: function (el) {

            var id = el.getAttribute("data-id");


            var prop = descCache[id];

            setUpProperties(prop);


            var toReplace = dom.gid('property-' + id);
            toReplace.removeAttribute('id');

            var container = toReplace.parentNode;

            var html = templates['named-property'](prop);
            dom.html(html, container, toReplace);
            container.removeChild(toReplace);


        }
    }

    //dom manipulation utilities
    var dom = {
        //get an element by ID
        gid: function(id) {
            return document.getElementById(id);
        },

        //add text to an element or replace the contents of the node with text
        text: function (el, text, repl) {
            el = typeof (el) == "string" ? this.gid(el) : el;

            if (repl) {
                while (el.lastChild) {
                    el.removeChild(el.lastChild);
                }
            }

            el.appendChild(document.createTextNode(text));
        },

        //create an element
        el: function(nodeType, attrs, parent) {
            var el = document.createElement(nodeType);
            if (attrs) {
                for (var attr in attrs) {
                    el.setAttribute(attr, attrs[attr]);
                }
            }
            if (parent) {
                parent.appendChild(el);
            }
            return el;
        },

        //append html to an element or insert it before
        html:function(html, parent, insertPoint) {
            var d = this.el('div');
            d.innerHTML = html;
            while (d.firstChild) {
                if (insertPoint) {
                    parent.insertBefore(d.firstChild, insertPoint);
                } else {
                    parent.appendChild(d.firstChild);
                }
            }
        },


        //get the child nodes of a node or optionally by a specific node name
        childs: function (node, nodeName) {

            var childs = [].filter.call(node.childNodes, function (n) {
                return !nodeName || n.nodeName.toLowerCase() == nodeName.toLowerCase();
            });

            return childs;
        }
    }

    //ajax to get the template html
    function getTemplate(callback) {

        var xhr = new XMLHttpRequest();

        xhr.onload = function () {

            if (xhr.status == 200) {

                var templates = document.createElement("DIV");
                templates.innerHTML = xhr.response;
                document.body.appendChild(templates);
                callback();

            } else {
                console.log("AJAX ERROR getTemplate");
                console.dir(xhr);
            }

        }

        xhr.open("GET", "/Content/WebApiTestClient/views.html");
        xhr.send();
    }


    //ajax to get a json object form the server
    function getJson(url, callback) {

        var xhr = new XMLHttpRequest();

        xhr.onload = function () {

            if (xhr.status == 200) {
                var data = JSON.parse(xhr.response);

                callback(data);
            } else {
                console.log("AJAX ERROR getJson");
                console.dir(xhr);
            }

        }

        xhr.open("GET", url);
        xhr.send();
    }


})();