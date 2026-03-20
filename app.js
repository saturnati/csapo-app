var app = {
	scenes: [],
	timeObj: false,
	currentObj: false,
	currentScene: false,
	html5QrcodeScanner: null, // A kamera objektum
	
	init: function() {
		var stored_extend = get_variable('extend', true);
		var stored_status = get_variable('status', true);
		var stored_current = get_variable('current', false);
		
		// CONFIG betöltése localStorage-ből
		var config = get_variable('app_config', true);
		if (!config) {
			config = { title: 'Vár QR kódra...', scenes: [] };
		}
		
		if (typeof config.title !== 'undefined') {
			document.title = 'Csapó: ' + config.title;
			$('span#project-title').html(config.title);
		}
		
		$('div#main').css({'height': $(window).height() + 'px'});
		this.currentObj = $('div#current');
		this.timeObj = $('span#time');
		if ($(this.timeObj).length === 1) {
			this.refreshtime();
			setInterval(this.refreshtime, 3000);
		}
		
		if (typeof config.scenes !== 'undefined') {
			for(var i=0; i<config.scenes.length; i++) {
				var row = config.scenes[i].split('|');
				if (row.length == 2) {
					this.scenes.push({
						'chapter': row[0],
						'info': row[1],
						'started': false,
						'ext': false
					});
				} else if (row.length == 3) {
					this.scenes.push({
						'chapter': row[1],
						'info': row[2],
						'group': row[0],
						'started': false,
						'ext': false
					});
				}
			}
		}
		
		if (stored_extend) {
			for(var i=0; i<stored_extend.length; i++) {
				this.scenes.push({
					'chapter': stored_extend[i].chapter,
					'info': stored_extend[i].info,
					'started': false,
					'ext': true
				});
			}
		}
		
		if (stored_status) {
			for(var i=0; i<stored_status.length; i++) {
				this.startScene(stored_status[i]);
			}
		}
		
		if (stored_current) {
			this.selectScene(stored_current);
		} else if (this.scenes.length > 0) {
			this.selectScene(0);
		}
		
		this.createSceneList();
	},
	
	refreshtime: function() {
		var now = new Date();
		$(app.timeObj).html(now.toLocaleString());
	},
	
	selectScene: function(index) {
		if (typeof this.scenes[index] !== 'undefined') {
			$(this.currentObj).removeClass('hidden');
			$('span#current-scene', this.currentObj).html(this.scenes[index].chapter);
			$('span#current-info', this.currentObj).html(this.scenes[index].info);
			if (this.scenes[index].started) {
				$(this.currentObj).removeClass('inactive');
			} else {
				$(this.currentObj).addClass('inactive');
			}
			set_veriable('current', index, false);
			this.currentScene = index;
		}
	},
	
	startScene: function(index) {
		if (typeof this.scenes[index] !== 'undefined') {
			$(this.currentObj).removeClass('inactive');
			this.scenes[index].started = true;
			this.refreshStatusVariable();
			this.createSceneList();
		}
	},
	
	stopScene: function(index) {
		if (typeof this.scenes[index] !== 'undefined') {
			this.scenes[index].started = false;
			this.refreshStatusVariable();
			this.createSceneList();
			if (index == this.currentScene) {
				$(this.currentObj).addClass('inactive');
			}
		}
	},
	
	refreshStatusVariable: function() {
		var started = [];
		for(var i=0; i<this.scenes.length; i++) {
			if (this.scenes[i].started) {
				started.push(i);
			}
		}
		set_veriable('status', started, true);
	},
	
	createSceneList: function() {
		var listObj = $('div#scene-list-box div#scene-list');
		$(listObj).empty();
		for(var i=0; i<this.scenes.length; i++) {
			if (typeof this.scenes[i].group !== 'undefined' && this.scenes[i].group !== '') {
				var groupItem = $('<span>').html(this.scenes[i].group);
				$(listObj).append(groupItem);
			}
			
			var item = $('<div>').attr('data-index', i);
			var started = this.scenes[i].started;
			var extended = this.scenes[i].ext;
			
			var name = this.scenes[i].chapter;
			if (this.scenes[i].info !== '') {
				name += ' / ' + this.scenes[i].info;
			}
			$(item).html(name);
			
			if (started) {
				$(item).addClass('started');
			}
			
			if (started || extended) {
				var buttons = $('<div class="buttons">').attr('data-index', i);
				if (started) {
					$(buttons).append($('<span class="stop">').html('&crarr;'));
				}
				if (extended) {
					$(buttons).append($('<span class="delete">').html('&times;'));
				}
				$(item).append(buttons);
			}
			
			$(listObj).append(item);
		}
	},
	
	toggleScenes: function() {
		$('div#scene-list-box').slideToggle();
	},
	
	resetValues: function() {
		// A TE LOGIKÁD SZERINT: Csak a státuszokat és az új jeleneteket törli, 
		// a QR kóddal beolvasott config-ot megtartja!
		if (confirm('Biztos törli az állapotot? A QR kódos fő jelenetlista megmarad!')) {
			localStorage.removeItem('extend');
			localStorage.removeItem('status');
			localStorage.removeItem('current');
			window.location = window.location.href; // Újratöltés
		}
	},
	
	addCustomScene: function() {
		var chapter = $.trim($('input#custom-scene-chapter').val());
		var info = $.trim($('input#custom-scene-info').val());
		if (chapter === '') {
			alert('Jelenet megadása kötelező!');
			return false;
		}
		for(var i=0;i<this.scenes.length; i++) {
			if (this.scenes[i].chapter === chapter && this.scenes[i].info === info) {
				alert('Ilyen jelenet már létezik!');
				return false;
			}
		}
		this.scenes.push({
			'chapter': chapter,
			'info': info,
			'started': false,
			'ext': true
		});
		
		this.refreshCustomlisVariable();
		this.createSceneList();
		return true;
	},
	
	removeCustomScene: function(index) {
		if (typeof this.scenes[index] === 'undefined' || !this.scenes[index].ext) {
			return false;
		}
		
		var temp = [];
		for(var i=0; i<this.scenes.length; i++) {
			if (i != index) {
				temp.push(this.scenes[i]);
			}
		}
		this.scenes = temp;
		
		this.refreshCustomlisVariable();
		this.refreshStatusVariable();
		this.createSceneList();
		
		if (typeof this.scenes[this.currentScene] === 'undefined') {
			this.currentScene -= 1;
			if (this.currentScene < 0 || typeof this.scenes[this.currentScene] === 'undefined') {
				this.currentScene = 0;
			}
		}
		this.selectScene(this.currentScene);
		return true;
	},
	
	refreshCustomlisVariable: function() {
		var list = [];
		for(var i=0; i<this.scenes.length; i++) {
			if (this.scenes[i].ext) {
				list.push(this.scenes[i]);
			}
		}
		set_veriable('extend', list, true);
	},
	
	openCustomSceneForm: function() {
		$('input#custom-scene-chapter,input#custom-scene-info').val('');
		$('div#add-scene-box').fadeIn();
	},
	
	closeCustomSceneForm: function() {
		$('div#add-scene-box').fadeOut();
	},

	// --- QR KÓD FUNKCIÓK ---
	openQRScanner: function() {
		$('div#qr-modal').removeClass('hidden');
		
		this.html5QrcodeScanner = new Html5QrcodeScanner(
			"qr-reader", { fps: 10, qrbox: 250 }, false);
		
		this.html5QrcodeScanner.render(
			(decodedText, decodedResult) => {
				app.handleQRSuccess(decodedText);
			},
			(errorMessage) => { /* Nem baj ha nem ismeri fel azonnal, keres tovább */ }
		);
	},

	closeQRScanner: function() {
		if (this.html5QrcodeScanner) {
			this.html5QrcodeScanner.clear().then(() => {
				$('div#qr-modal').addClass('hidden');
			});
		} else {
			$('div#qr-modal').addClass('hidden');
		}
	},

	handleQRSuccess: function(decodedText) {
		try {
			var newConfig = JSON.parse(decodedText);
			if (!newConfig.scenes || !Array.isArray(newConfig.scenes)) {
				alert("A beolvasott adat nem megfelelő formátumú jelenetlista!");
				return;
			}

			var savedConfig = get_variable('app_config', true);
			
			// Ha APPEND=TRUE és van már mentett config
			if (newConfig.append && savedConfig && savedConfig.scenes) {
				savedConfig.scenes = savedConfig.scenes.concat(newConfig.scenes);
				if (newConfig.title) savedConfig.title = newConfig.title;
			} else {
				// Ha nem append, akkor teljesen új config (státuszokat is eldobjuk)
				savedConfig = newConfig;
				localStorage.removeItem('extend');
				localStorage.removeItem('status');
				localStorage.removeItem('current');
			}

			// Mentés
			set_veriable('app_config', savedConfig, true);
			
			// Kamera bezárása és frissítés
			this.closeQRScanner();
			alert("Sikeres beolvasás!");
			window.location = window.location.href; // Újratöltés, hogy betöltse a friss adatokat

		} catch(e) {
			alert("Hibás QR kód formátum! (Vigyázz a dupla idézőjelekre a JSON-ben)");
		}
	}
};

function get_variable(name, decode) {
	var value = localStorage.getItem(name);
	if (!value) {
		value = false;
	} else if (decode) {
		value = JSON.parse(value);
	}
	return value;
}

function set_veriable(name, value, encode) {
	if (encode) {
		value = JSON.stringify(value);
	}
	localStorage.setItem(name, value);
}

$(document).ready(function() {
	app.init();
	
	$('div#current button').click(function() {
		app.startScene(app.currentScene);
	});
	
	$('span#footer').click(function() {
		app.toggleScenes();
		app.closeCustomSceneForm();
	});
	
	$('button#reset').click(function() {
		app.resetValues();
	});
	
	$('button#extend-scene').click(function() {
		app.openCustomSceneForm();
	});
	
	$('button#custom-scene-cancel').click(function() {
		app.closeCustomSceneForm();
	});
	
	$('button#custom-scene-save').click(function() {
		if (app.addCustomScene()) {
			app.closeCustomSceneForm();
		}
	});

	// Új gombok a QR olvasóhoz
	$('button#btn-qr-scan').click(function() {
		app.openQRScanner();
	});
	$('button#btn-qr-close').click(function() {
		app.closeQRScanner();
	});
	
	$(document).on('click', 'div#scene-list > div > div.buttons > span', function() {
		var index = $($(this).parent('div.buttons')).attr('data-index');
		if (typeof index === 'undefined') {
			return false;
		}
		
		if ($(this).hasClass('stop')) {
			if (confirm('Biztos leállítja a forgatást?')) {
				app.stopScene(index);
			}
		}
		if ($(this).hasClass('delete')) {
			if (confirm('Biztos törli a jelenetet?')) {
				app.removeCustomScene(index);
			}
		}
		
		return false;
	});
	
	$(document).on('click', 'div#scene-list > div', function() {
		var sceneIndex = $(this).attr('data-index');
		if (typeof sceneIndex !== 'undefined') {
			app.selectScene(sceneIndex);
			app.toggleScenes();
		}
	});
});