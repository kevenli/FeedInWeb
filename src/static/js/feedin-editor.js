/* JSON */
JSON.stringify = JSON.stringify || function(obj) {
	var t = typeof (obj);
	if (t != "object" || obj === null) {
		// simple data type
		if (t == "string")
			obj = '"' + obj + '"';
		return String(obj);
	} else {
		// recurse array or object
		var n, v, json = [], arr = (obj && obj.constructor == Array);
		for (n in obj) {
			v = obj[n];
			t = typeof (v);
			if (t == "string")
				v = '"' + v + '"';
			else if (t == "object" && v !== null)
				v = JSON.stringify(v);
			json.push((arr ? "" : '"' + n + '":') + String(v));
		}
		return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
	}
};

(function($) {
	function XPathFetchModule() {
		this.ui = $("<div>")
				.addClass("module")
				.html(
						"<div>"
								+ "<div class='title ui-widget-header'><span></span>"
								+ "<ul class='buttons'></ul>"
								+ "</div>"
								+ "<div class='content'>"
								+ "<div><span>URL:</span><input name='url' /></div>"
								+ "<div><span>Extract using XPath:<input name='xpath' /></div>"
								+ "<div><span>Use HTML parser</span><input type='checkbox' /></div>"
								+ "<div><span>Emit items as string</span><input type='checkbox' /></div>"
								+ "</div>" + "</div>");

		this.ui.find("div.title>span").text("XPathFetch");
		this.ui.find("ul.buttons").append(
				$("<li>").addClass("minimal ui-icon ui-icon-minus"),
				$("<li>").addClass("remove ui-icon ui-icon-close"));

		this.type = 'xpathfetch';
		this.id = null;

		this.getConf = function() {
			conf = {};
			conf['URL'] = this.ui.find("input[name='url']").val();
			conf['xpath'] = this.ui.find("input[name='xpath']").val();
			return conf;
		}
		
		this.setConf = function(conf){
			if (conf['URL']){
				this.ui.find("input[name='url']").val(conf['URL']);
			}
			
			if(conf['xpath']){
				this.ui.find("input[name='xpath']").val(conf['xpath']);
			}
		}

		this.terminals = [ {
			'name' : '_OUTPUT'
		} ];
		this.getTerminals = function() {
			return this.terminals;
		}
	}
	
	function OutputModule(){
		this.ui = $("<div>")
			.addClass("module")
			.html(
				"<div>"
						+ "<div class='title ui-widget-header'><span></span>"
						+ "<ul class='buttons'></ul>"
						+ "</div>"
						+ "</div>");
		this.ui.find("div.title>span").text("Output");
		
		this.id = "_OUTPUT";
		this.type = 'output';
		this.getConf = function(){
			return [];
		}
		
		this.setConf = function(conf){
			
		}
		
		this.terminals = [ {
			'name' : '_INPUT'
		} ];
		this.getTerminals = function() {
			return this.terminals;
		}
		
	}
	
	function Wire(){
		this._startPoint = {};
		this._endPoint = {};
		this.canvas = $("<canvas>");
		this.src = {}
		this.tgt = {}
		
		this.start = function(sourceControl, left, top){
			
			parent = $(sourceControl).parents(".terminal");
			if (parent.hasClass("south")){
				this.src = {};
			}else if(parent.hasClass("north")){
				this.tgt = {};
			}
			
			this._startPoint['left']=left;
			this._startPoint['top']=top;
			this.canvas.css("position", 'absolute');
			//this.canvas.css("background-color", "white");
			this.canvas.css("top", top + 5);
			this.canvas.css("left", left - 5);
		};
		
		this.update = function(left, top){
			this._endPoint['left'] = left;
			this._endPoint['top'] = top;
			canvas = this.canvas[0];
			canvas.width = left - this._startPoint['left'] +  10;
			canvas.height = top - this._startPoint['top'] + 10;
			
			
			var ctx=this.canvas[0].getContext("2d");
			ctx.clearRect ( 0 , 0 , canvas.width, canvas.height );
			ctx.translate(5,5);
			ctx.lineWidth=2;
			ctx.fillStyle="blue";
			ctx.lineCap="round";
			ctx.shadowColor="blue";
			ctx.shadowBlur = 5;
			
			ctx.beginPath();
			ctx.moveTo(0,0);
			ctx.quadraticCurveTo(0,100,left - this._startPoint['left'] - 5, top - this._startPoint['top'] - 5);
			ctx.stroke();
		};
		

	}

	function Editor() {
		this.modules = [];
		this.feedId = null;
		this.wires = [];
		this.init = function(settings) {
			this.settings = settings;
			$editor = this;
			$(".control").draggable({
				appendTo : "body",
				opacity : 0.7,
				helper : "clone",
				cursor : "move"
			});
			
			this.editingRegion = settings['editingRegion'];

			$("#editor").droppable(
					{
						drop : function(event, ui) {
							controlType = ui.draggable.attr("control-type");
							if (controlType) {
								newControl = $editor.buildModule(controlType);
								$editor.addModule(newControl);

								editorPosition = $("#editor").offset();
								newControl.ui.css("top",event.pageY - editorPosition.top - 10)
										.css("left",event.pageX	- editorPosition.left- 30);

								
							}
						}
					});
		};

		this.addModule = function(module) {
			this.modules.push(module);

			if(!module.id){
				module.id = this.generateModuleId();
			}
			
			module.ui.find(".buttons .remove").click(function() {
				$editor.removeModule(module);
			})
			
			module.ui.addClass("editing_control");
			
			module.ui.draggable({
									cursor : "move",
									containment : "#editor",
									scroll : true, 
									drag: $editor.onModuleMove
								});
			
			module.ui.css("position", "absolute");
			
			moduleTerminals = module.getTerminals();
			for(terminalIndex in moduleTerminals){
				terminal = moduleTerminals[terminalIndex];
				terminalPoint = $("<span>").addClass("terminalrender ui-icon ui-icon-radio-off");
				if (terminal.name=='_INPUT'){
					module.ui.append($("<div>")
							.addClass("terminal north")
							.append(terminalPoint));
				}
				
				if (terminal.name=='_OUTPUT'){
					module.ui.append($("<div>").addClass("terminal south").append(terminalPoint));
				}
				
				terminalPoint.draggable({helper:'clone',
					appendTo : "body",
					start:$editor.startWiring, 
					stop:$editor.stopWiring, 
					drag:$editor.dragWiring});
			}
			
			this.editingRegion.append(module.ui);
			
			
		};

		this.removeModule = function(module) {
			this.modules.pop(module);
			module.ui.remove();
		}

		this.buildModule = function(moduleType) {
			module = null;
			switch (moduleType) {
			case "xpathfetch":
				module = new XPathFetchModule;
				break;
			case "output":
				module = new OutputModule;
				break;
			}

			return module;
		};

		this.generateModuleId = function() {
			min = 0;
			max = this.modules.length + 1;
			while (true) {
				newId = 'm' + (Math.floor(Math.random() * (max - min)) + min);
				found = false;
				for (module in this.modules) {
					if (module.id == newId) {
						found = true;
						break;
					}
				}
				if (!found) {
					return newId;
				}
			}

		}

		this.toJson = function() {
			var obj = {
				'feed_id' : this.feedId
			};
			obj['modules'] = []
			obj['layout'] = []
			for (i in this.modules) {
				module = this.modules[i];
				obj['modules'].push({
					'type' : module.type,
					'id' : module.id,
					'conf' : module.getConf()
				});
				
				obj['layout'].push({
					'id' : module.id,
					'xy' : [module.ui.position().left, 
					        module.ui.position().top]
				});
			}
			return JSON.stringify(obj);
		}

		this.save = function() {
			$.ajax({
				url : $editor.settings['saveUrl'],
				method : 'post',
				data : {
					'feedinfo' : editor.toJson()
				},
				dataType : 'json',
				error : function() {
					console.log("error");
				},
				success : function(data) {
					console.log("success");
					$editor.feedId = data['feed_id']
				}
			});
		};
		
		this._loadFeedData = function(data){
			this.feedId = data['feed_id'];
			for(i=0;i<data['modules'].length;i++){
				moduleInfo = data['modules'][i];
				module = this.buildModule(moduleInfo.type);
				module.id = moduleInfo.id;
				module.setConf(moduleInfo.conf);
				this.addModule(module);
				
				if (data['layout']){
					for(j=0;j<data['layout'].length;j++){
						if (data['layout'][j].id == module.id){
							module.ui.css("left", data['layout'][j].xy[0]);
							module.ui.css("top", data['layout'][j].xy[1]);
							break;
						}
					}
				}
			}
		}

		this.load = function(id) {
			for(moduleIndex in this.modules){
				this.removeModule(this.modules[moduleIndex]);
			}
			$editor = this;
			$.ajax({
				url : $editor.settings['loadUrl'],
				method : 'get',
				data : {
					'id' : id
				},
				dataType : 'json',
				error : function() {
					console.log("error");
				},
				success : function(data) {
					console.log("success");
					$editor._loadFeedData(data);
				}
			});
		}
		
		this.currentWire = null;
		this.startWiring = function(event, ui){
			wire = new Wire;
			editorPosition = $("#editor").offset();
			sourceControl = ui.helper[0];
			wire.start(sourceControl, ui.offset.left - editorPosition.left, ui.offset.top - editorPosition.top);
			
			$editor.currentWire = wire;
			wire.canvas.appendTo($editor.editingRegion);
			console.log("startWiring");
		};
		
		function getElsAt(root, top, left){
		    return $(root)
		               .find(".terminalrender")
		               .filter(function() {
		                           return $(this).offset().top <= top + 5 
		                           			&& $(this).offset().top + $(this).height() >= top -5
		                                    && $(this).offset().left <= left + 5
		                                    && $(this).offset().left + $(this).width() >= left-5;
		               });
		}
		
		this.dragWiring = function(event, ui){
			console.log("dragWiring");
			editorPosition = $("#editor").offset();
			$editor.currentWire.update(ui.offset.left - editorPosition.left + 10, 
					ui.offset.top - editorPosition.top + 10);
		};
		
		this.stopWiring = function(event, ui){
			console.log("stopWiring");
			stopPoint = [event.pageX, event.pageY]
			console.log(stopPoint);
			pointElements = getElsAt($editor.editingRegion, event.pageY, event.pageX);
			console.log(pointElements);
			if (pointElements.length>0){
				$editor.wires.push($editor.currentWire);
			}else{
				$editor.currentWire.canvas.remove();
			}
		};
		
		this.onModuleMove = function(event, ui){
			module = ui.helper[0];
			console.log("on module move");
			console.log(module);
		}
	}

	$.fn.editor = function(options) {
		var settings = $.extend({
			'saveUrl' : '/feeds/save', 
			'loadUrl' : '/feeds/load'
		}, options);
		settings['editingRegion'] = this;
		$("#div_left_menu").accordion();
		var editor = new Editor;
		editor.init(settings);
		outputModule = editor.buildModule('output');
		editor.addModule(outputModule);
		return editor;
	};
}(jQuery));
