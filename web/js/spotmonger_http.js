
(function() {


	// https://stackoverflow.com/questions/194846/is-there-any-kind-of-hash-code-function-in-javascript
	String.prototype.hashCode = function(){
		var hash = 0;
		for (var i = 0; i < this.length; i++) {
			var character = this.charCodeAt(i);
			hash = ((hash<<5)-hash)+character;
			hash = hash & hash; // Convert to 32bit integer
		}
		return hash;
	}

	

	var url = "passthru.php";
	var active_cart, hash_cart;

	document.addEventListener("DOMContentLoaded", function() {
		update_state();



	});



	function update_state() {


		var state_req = new XMLHttpRequest();

		state_req.onreadystatechange = function() {
			if (state_req.readyState == 4 && state_req.status == 200) {
				data = JSON.parse(state_req.responseText);
				//console.log(data);

				let play_ele = document.getElementById('play');
				let main_ele = document.getElementById('main');
				let cartname_ele   = document.querySelector(".cartname");
				let trackname_ele  = document.querySelector("p.trackname");
				let tracknum_ele   = document.querySelector(".tracknum");
				let tracknum_t_ele = document.querySelector(".tracknum .t");
				let tracknum_o_ele = document.querySelector(".tracknum .o");
				let time_ele       = document.querySelector("#display .time");
				let fill_ele       = document.querySelector("#display .bar .fill");


				if (data.display.state != 'PAUSED' && !(main_ele.classList.contains('playing')) ) {
					main_ele.classList.add('playing');
					play_ele.innerHTML = "&#xf04c;";
				} else if (data.display.state == 'PAUSED' && main_ele.classList.contains('playing')) {
					main_ele.classList.remove('playing');
					play_ele.innerHTML = "&#xf04b;";
				}

				if (data.display.cart == undefined || (cartname_ele.innerText.trim() != data.display.cart.trim()))
					cartname_ele.innerHTML = data.display.cart;

				if (data.display.track == undefined || (trackname_ele.innerText.trim() != data.display.track.trim()))
					trackname_ele.innerHTML = data.display.track;



				if (data.display.cart_length == 0) {
					tracknum_ele.style.display = 'none';
				} else {
					tracknum_t_ele.innerHTML = data.display.cart_position;
					tracknum_o_ele.innerHTML = data.display.cart_length;
					tracknum_ele.style.display = 'block';
				}

				time_ele.innerHTML = (data.display.track_remain != 0) ? data.display.track_remain : '';
				fill_ele.style.width = data.display.percentage + '%';


				//	if (is not single) and (non-zero track length) and ((last 20 seconds of 2nd to last track) or (is last track))
				// 	if (is single) and (last 20 seconds of track and track length non-zero)
				//
				//

				if (
					(
						( data.display.cart_length != 1) &&
						( data.display.track_remain_s != 0) &&
						(
							(data.display.cart_position == (data.display.cart_length - 1) && data.display.track_remain_s <= 20) ||
							(data.display.cart_position == data.display.cart_length)
						)
					) ||
					(
						(data.display.cart_length == 1) &&
						(
							(data.display.track_remain_s <= 20) &&
							data.display.track_remain_s != 0
						)
					)
				) {

					if (!main_ele.classList.contains('ending_soon')) main_ele.classList.add('ending_soon');

				} else {

					if (main_ele.classList.contains('ending_soon')) main_ele.classList.remove('ending_soon');

				}

				let hash = JSON.stringify(data.state.carts).hashCode();

				if (hash_cart != hash) {

					let cart_list = document.querySelector("#carts > div");
					cart_list.innerHTML = "";


					for (x in data.state.carts) {
						let new_div = document.createElement('div');
						new_div.className = 'cart';
						new_div.id = data.state.carts[x].id;
						new_div.insertAdjacentHTML(
							'afterbegin', 
							`<div class="name">${data.state.carts[x].name}</div>`+
							`<div class="state"></div>`+
							`<div class="time">${data.state.carts[x].runtime}</div>`+
							"<div class='timeset icon'>&#xf017;</div>"
						);

						new_div.addEventListener('click', function() { 
							load_cart(data.state.carts[x].id);
						});

						new_div.querySelector('div.timeset').addEventListener('click', function(evt) {
							console.log("cue", evt.target.parentNode.id);
							evt.stopPropagation();
						});

						cart_list.appendChild(new_div);
					}
		



					hash_cart = hash;
				}



				setTimeout(update_state, 250);



			}
		}


		state_req.open("GET", `${url}?cmd=status`, true);
		state_req.send();


	}

})();
