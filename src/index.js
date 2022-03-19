'strict';

import Brb from './js/modules/class-brb';

import './scss/main.scss';
import './js/assets';


(function () {
    window.addEventListener('DOMContentLoaded', (event) => {

        new Brb({
            dom: document.getElementById('container')
        });

    });
})();
