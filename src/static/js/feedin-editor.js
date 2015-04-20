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
	function ModuleTerminal(module, id, type){
		this.id = id;
		this.ui = $("<div>")
			.addClass("terminal")
			.addClass(type)
			.append($("<span>").addClass("terminalrender ui-icon ui-icon-radio-off"));
		this.ui[0].terminal = this;
		this.module = module;
	}
	
	function Module(){
		this.type = null;
		this.id = null;
		this.terminals = [];
		this.getTerminals = function() {
			return this.terminals;
		};
		
		this.findTerminal = function(id){
			for(terminalIndex in this.terminals){
				if(this.terminals[terminalIndex].id == id){
					return this.terminals[terminalIndex];
				}
			}
		};
	}
	
	function XPathFetchModule() {
		Module.call(this);
		this.type = 'xpathfetch';
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

		this.terminals = [
		                  new ModuleTerminal(this, '_OUTPUT', 'south')
		                  ];

	}
	
	function OutputModule(){
		Module.call(this);
		this.id = "_OUTPUT";
		this.type = 'output';

		this.ui = $("<div>")
			.addClass("module")
			.html(
				"<div>"
						+ "<div class='title ui-widget-header'><span></span>"
						+ "<ul class='buttons'></ul>"
						+ "</div>"
						+ "</div>");
		this.ui.find("div.title>span").text("Output");
		
		this.getConf = function(){
			return [];
		}
		
		this.setConf = function(conf){
			
		};
		
		this.terminals = [ 
		                   new ModuleTerminal(this, '_INPUT', 'north')
		                   ];
		
	}
	
	function Wire(){
		this._startPoint = {};
		this._endPoint = {};
		this.borderWidth = 5;
		this.canvas = $("<canvas>");
		this.src = {}
		this.tgt = {}
		
		this.start = function(editingRegion, module, terminal){
			startleft = terminal.ui.offset().left - editingRegion.offset().left;
			starttop = terminal.ui.offset().top - editingRegion.offset().top;
			if (terminal.id == '_OUTPUT'){
				this.src['module'] = module;
				this.src['terminal'] = terminal;
			}else if(terminal.id =='_INPUT'){
				this.tgt['module'] = module;
				this.tgt['terminal'] = terminal;
			}
			
			this._startPoint['left']=startleft;
			this._startPoint['top']=starttop;
			this.canvas.css("position", 'absolute');
			// canvas background color, for debug only
			//this.canvas.css("background-color", "white");   
			this.canvas.css("top", starttop - this.borderWidth);
			this.canvas.css("left", startleft - this.borderWidth);
		};
		
		this.update = function(left, top){
			this._endPoint['left'] = left;
			this._endPoint['top'] = top;
			newCornor = [this.borderWidth,this.borderWidth];
			startPoint = [0, 0];
			if (this.src.terminal){
				controlPoint1 = [0, 100];
			}else{
				controlPoint1 = [0, -100];
			}
			
			endPoint = [left - this._startPoint.left, top - this._startPoint.top];

			canvas = this.canvas[0];
			canvasWidth = Math.max(startPoint[0], controlPoint1[0], endPoint[0]) - 
				Math.min(startPoint[0], controlPoint1[0], endPoint[0])
				+ this.borderWidth * 2;
			
			canvasHeight = Math.max(startPoint[1], controlPoint1[1], endPoint[1]) 
				- Math.min(startPoint[1], controlPoint1[1], endPoint[1])
				+ this.borderWidth * 2;
			
			canvasOffsetX = Math.min(startPoint[0], controlPoint1[0], endPoint[0]);
			canvasOffsetY = Math.min(startPoint[1], controlPoint1[1], endPoint[1]);
			
			this.canvas.css('top', this._startPoint.top + canvasOffsetY - this.borderWidth);
			this.canvas.css('left', this._startPoint.left + canvasOffsetX - this.borderWidth);
			
			newCornor = [-canvasOffsetX + this.borderWidth, -canvasOffsetY + this.borderWidth];

			canvas.width = canvasWidth;
			canvas.height = canvasHeight;
			
			
			var ctx=this.canvas[0].getContext("2d");
			ctx.clearRect ( 0 , 0 , canvas.width, canvas.height );
			ctx.translate(newCornor[0], newCornor[1]);
			ctx.lineWidth=2;
			ctx.fillStyle="blue";
			ctx.lineCap="round";
			ctx.shadowColor="blue";
			ctx.shadowBlur = 5;
			
			ctx.beginPath();
			ctx.moveTo(0,0);
			ctx.quadraticCurveTo(controlPoint1[0], controlPoint1[1],
					endPoint[0], endPoint[1]);
			ctx.stroke();
		};
		
		this.end = function(editingRegion, module, terminal){
			endLeft = terminal.ui.offset().left - editingRegion.offset().left;
			endTop = terminal.ui.offset().top - editingRegion.offset().top;
			this.update(endLeft, endTop);
			if (terminal.id == '_OUTPUT'){
				this.src['module'] = module;
				this.src['terminal'] = terminal;
			}else if(terminal.id =='_INPUT'){
				this.tgt['module'] = module;
				this.tgt['terminal'] = terminal;
			}
		}
		

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
									drag: function(event, ui){
										$editor.onModuleMove(module, event, ui);
									} 
								});
			
			module.ui.css("position", "absolute");
			
			moduleTerminals = module.getTerminals();
			for(terminalIndex in moduleTerminals){
				terminal = moduleTerminals[terminalIndex];
				
				terminalPoint = terminal.ui.find(".terminalrender")
				
				terminalPoint.draggable({helper:'clone',
					appendTo : "body",
					start: (function(editor, module, terminal){return function (event, ui){
						editor.startWiring(module, terminal, event, ui);
					}})($editor, module, terminal), 
					stop: (function(editor, module, terminal){return function(event, ui){
						editor.stopWiring(module, terminal, event, ui);
					}})($editor, module, terminal),
					drag:(function(editor, module, terminal){return function(event, ui){
						editor.dragWiring(module, terminal, event, ui);
						}})($editor, module, terminal)
					});
				
				module.ui.append(terminal.ui);
			}
			
			this.editingRegion.append(module.ui);
			
			
		};

		this.removeModule = function(module) {
			this.modules.pop(module);
			module.ui.remove();
			
			for(wireIndex in this.wires){
				wire = this.wires[wireIndex];
				if (wire.tgt.module == module){
					this.removeWire(wire);
				}
				if (wire.src.module == module){
					this.removeWire(wire);
				}
			}
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
				for (moduleIndex in this.modules) {
					module = this.modules[moduleIndex];
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
			obj['modules'] = [];
			obj['layout'] = [];
			obj['wires'] = [];
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
			for (wireIndex in this.wires){
				wire = this.wires[wireIndex];
				obj['wires'].push(
					{'src': {'id': wire.src.terminal.id, 
						'moduleid': wire.src.module.id }, 
					'tgt': {'id': wire.tgt.terminal.id, 
						'moduleid': wire.tgt.module.id}}	
				);
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
		
		this.findModule = function(id){
			for(moduleIndex in this.modules){
				if (this.modules[moduleIndex].id == id){
					return this.modules[moduleIndex];
				}
			}
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
			
			if(data['wires']){
				for(wireIndex in data['wires']){
					wireInfo = data['wires'][wireIndex];
					wire = new Wire();
					sourceModule = this.findModule(wireInfo.src.moduleid);
					sourceTerminal = sourceModule.findTerminal(wireInfo.src.id);
					targetModule = this.findModule(wireInfo.tgt.moduleid);
					targetTerminal = targetModule.findTerminal(wireInfo.tgt.id);
					wire.start(this.editingRegion, sourceModule, sourceTerminal);
					wire.end(this.editingRegion, targetModule, targetTerminal);
					//this.editingRegion.append(wire.canvas);
					//this.wires.push(wire);
					this.addWire(wire);
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
		this.startWiring = function(module, terminal, event, ui){
			console.log("startWiring");
			console.log(module);
			console.log(terminal);
			wire = new Wire;
			editorPosition = $("#editor").offset();
			sourceControl = ui.helper[0];
			wire.start(this.editingRegion, module, terminal, ui.offset.left - editorPosition.left, ui.offset.top - editorPosition.top);
			
			$editor.currentWire = wire;
			wire.canvas.appendTo($editor.editingRegion);
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
		
		this.dragWiring = function(module, terminal, event, ui){
			console.log("dragWiring");
			editorPosition = $("#editor").offset();
			$editor.currentWire.update(ui.offset.left + ui.helper.width() / 2 - editorPosition.left, 
					ui.offset.top + ui.helper.height() /2 - editorPosition.top);
		};
		
		this.stopWiring = function(module, terminal, event, ui){
			//console.log("stopWiring");
			stopPoint = [event.pageX, event.pageY]
			//console.log(stopPoint);
			pointElements = getElsAt($editor.editingRegion, event.pageY, event.pageX);
			//console.log(pointElements);
			if (pointElements.length>0){
				
				terminal = pointElements.parents(".terminal")[0].terminal;
				this.currentWire.end($editor.editingRegion, terminal.module, terminal);
				for(wireIndex in this.wires){
					existingWire = this.wires[wireIndex];
					if (existingWire.tgt.terminal == this.currentWire.tgt.terminal){
						this.removeWire(existingWire);
					}
					if (existingWire.src.terminal == this.currentWire.src.terminal){
						this.removeWire(existingWire);
					}
				}
				this.addWire(this.currentWire);
				//console.log(terminal);
			}else{
				$editor.currentWire.canvas.remove();
			}
		};
		
		this.addWire = function(wire){
			this.editingRegion.append(wire.canvas);
			this.wires.push(wire);
		};
		
		this.removeWire = function(wire){
			wire.canvas.remove();
			this.wires.pop(wire);
		};
		
		this.onModuleMove = function(module, event, ui){
			//module = ui.helper[0];
			console.log("on module move");
			
			for (wireIndex in this.wires){
				wire = this.wires[wireIndex];
				if (wire.src.module == module){
					//console.log(module);
					wire.start(this.editingRegion, module, wire.src.terminal);
					wire.update(wire.tgt.terminal.ui.offset().left - this.editingRegion.offset().left, 
							wire.tgt.terminal.ui.offset().top - this.editingRegion.offset().top);
					break;
				}else if(wire.tgt.module == module){
					wire.update(wire.tgt.terminal.ui.offset().left - this.editingRegion.offset().left, 
							wire.tgt.terminal.ui.offset().top - this.editingRegion.offset().top);
					break;
				}
			}
		};
		
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
