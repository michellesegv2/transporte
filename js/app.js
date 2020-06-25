const Transport = (function () {
  const data = {
    typeSelected: false,
    urlListOfTypes: 'https://apigateway.pvn.gob.pe/a/v1/AutorizacionAAM/Listar-ConfVehicular',
    urlDataPlate: 'https://apigateway.pvn.gob.pe/ts/v1/VehicularMtc?placa=',
    selectType: document.getElementById('select-type'),
    itemsTransport: document.querySelectorAll('.transport-item'),
    inputPlate1: document.getElementById('plate-1'),
    inputPlates: document.querySelectorAll('.input-plate'),
    ctnInputPlates: document.querySelectorAll('.container-input-plate'),
    // alertNotData: document.getElementById('alert-not-found-data'),
    ctnNumEjes: document.querySelector('.ctn-num-ejes'),
    numEjes: document.getElementById('numero-ejes'),
    ctnPreviewTransport: null
  };

  const events = {
    // Evento para cambiar la img dependiendo del tipo
    onSelectTypeChange: function () {
      data.selectType.addEventListener('change', () => {
        const svgSelected = data.selectType.value;
        const cantOfTypes = data.selectType.options[data.selectType.selectedIndex].getAttribute('data-items');
        data.itemsTransport.forEach((elem) => {
          if (elem.classList.contains(svgSelected)) {
            elem.classList.remove('is-hidden');
            data.ctnPreviewTransport = svgSelected;
          } else {
            elem.classList.add('is-hidden');
          }
        });

        data.typeSelected = true;

        // Mostrando / ocultando 'número de ejes'
        data.ctnPreviewTransport.indexOf('cigueña') == -1 ? data.ctnNumEjes.classList.remove('is-hidden') : data.ctnNumEjes.classList.add('is-hidden');
        data.ctnPreviewTransport.indexOf('dolly') > -1 ? data.ctnNumEjes.classList.add('dolly') : data.ctnNumEjes.classList.remove('dolly');

        // Limpiando valores anteriores
        methods.restart();

        // Mostrando inputs de placas necesarios
        methods.showInputsPlates(cantOfTypes)
      });
    },

    // Eventos para el input de la placa
    onBlurPlate: function (elem) {
      elem.addEventListener('focusout', (e) => {
        const plate = e.target.value;
        const numInput = e.target.id.split('-')[1];
        methods.validatePlate(plate, numInput);
        if (plate.length == 0)
          e.target.parentNode.classList.remove('focus');
      });
    },
    onFocusPlate: function (elem) {
      elem.addEventListener('focus', (e) => {
        e.target.parentNode.classList.add('focus');
      });
    },
    onEnterPlate: function (elem) {
      elem.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          methods.validatePlate(e.target.value, e.target.id.split('-')[1]);
        }
      });
    }
  };

  const methods = {
    // Servicio de consulta a API
    queryAxios: function (_url, _callback) {
      axios.get(_url, {
        responseType: 'json'
      })
        .then(function (res) {
          if (res.status == 200) {
            let info = res.data.result != undefined ? res.data.result : res.data.Result;
            _callback(info);
          }
        })
        .catch(function (err) {
          console.log(err);
        });
    },

    // Obteniendo tipos de transportes
    getDataTypeConfig: function () {
      methods.queryAxios(data.urlListOfTypes, (listOfTypes) => {
        listOfTypes.forEach(item => {
          // Creando option desde la data recibida
          let type = document.createElement('option');
          const cantOfTypes = item.cConfiguracionVehicular.split('/').length;
          type.innerText = item.cDescripcion;
          type.setAttribute('data-items', cantOfTypes)
          type.value = item.cConfiguracionVehicular
            .replace(/ \/ /g, '-')
            .replace(/ /g, '-')
            .toLowerCase();

          // Añadiendo options a select
          data.selectType.appendChild(type)
        });
      });
    },

    // Obteniendo data de placas para cant de ejes
    getDataOfPlate: function (_plate, _numInput) {
      methods.queryAxios(data.urlDataPlate + _plate, (dataOfPlate) => {
        if (dataOfPlate != null) {
          const ejes = dataOfPlate.ejes;
          // const ejes = 10;
          const arrRender = methods.showEjes(ejes, _numInput);
          arrRender.forEach(elem => {
            document.querySelectorAll(`.${data.ctnPreviewTransport} g`)[elem].classList.remove('is-hidden-eje');
          })
        }
        else
          methods.showAlert('Número de placa incorrecto o no ha sido registrado en el MTC', _numInput)
      });
    },

    // Cantidad de ejes a mostrar
    validatePlate: function (_plate, _numInput) {
      const regxPlate = /-/g;
      if (_plate.length > 0) {
        if (!data.typeSelected)
          methods.showAlert('Debe seleccionar un tipo', _numInput);
        else {
          if (regxPlate.test(_plate)) {
            methods.showAlert('Evite ingresar caracteres especiales', _numInput)
          } else {
            document.getElementById(`alert-not-found-data-${_numInput}`).parentNode.classList.add('is-hidden');
            methods.getDataOfPlate(_plate, _numInput)
          }
        }
      }
      else {
        methods.showAlert('Ingrese un valor', _numInput)
      }
    },

    // obteniendo ejes a mostrar
    showEjes: function (_ejes, _numInput) {
      const typeTransport = data.ctnPreviewTransport;
      let init;
      let max;
      let direction;
      let ejes;

      // Setando valores en base al tipo de estructura
      switch (_numInput) {
        case '1':
          init = 0;
          max = 4;
          direction = 'left';
          break;
        case '2':
          init = 4;
          direction = 'right';
          max = typeTransport.indexOf('dolly') > -1
            ? 4 : typeTransport.indexOf('cigueña') > -1
              ? 14 : 5;
          typeTransport.indexOf('dolly') > -1
            ? true : data.numEjes.innerHTML = _ejes;
          break;
        case '3':
          init = 8;
          max = 5;
          direction = 'right';
          data.numEjes.innerHTML = _ejes
          break;
      }

      // Estableciendo la cantidad de ejes
      ejes = _ejes <= max ? parseInt(_ejes) : max;

      // Llenar array con los index de ejes que se mostrarán
      let renderEjesIndex = []

      if (direction == 'left') {
        for (let i = init; i < ejes; i++) {
          renderEjesIndex.push(i);
        }
      }
      else {
        for (let i = init + max - 1; i > init + max - ejes - 1; i--) {
          renderEjesIndex.unshift(i);
        }
      }

      return renderEjesIndex;
    },

    // Mensaje de alerta
    showAlert: function (_text, _input) {
      document.getElementById(`alert-not-found-data-${_input}`).parentNode.classList.remove('is-hidden')
      document.getElementById(`alert-not-found-data-${_input}`).innerText = _text;
    },

    //Mostrando inputs de placa
    showInputsPlates: function (_numOfTypes) {
      for (let i = 0; i < _numOfTypes; i++) {
        data.ctnInputPlates[i].classList.remove('is-hidden')
      }
    },

    // Seteando valores inciales
    restart: function () {
      // Limpiando input de placa
      data.inputPlates.forEach((plate) => {
        plate.value = '';
      })

      // Reestableciendo valor de número de ejes
      data.numEjes.innerHTML = '00'

      // Ocultando warning
      // data.ctnAlertNotData.classList.add('is-hidden');

      // Mostrando todos los ejes
      document.querySelectorAll('.transport-item g').forEach((elem) => {
        elem.classList.add('is-hidden-eje');
      })

      //Ocultando todos los inputs de placa
      data.ctnInputPlates.forEach((elem) => {
        elem.classList.add('is-hidden');
        elem.value = '';
      })
    }

  };

  const initialize = function () {
    // Funcionalidades del select tipo
    events.onSelectTypeChange();
    methods.getDataTypeConfig();

    // Eventos del input placa
    data.inputPlates.forEach((plate) => {
      events.onEnterPlate(plate);
      events.onBlurPlate(plate);
      events.onFocusPlate(plate);
    })
  };

  return {
    init: initialize
  };
})();


document.addEventListener(
  'DOMContentLoaded',
  function () {
    Transport.init();
  },
  false
);

/*
** URLS APIS
*** TIPOS DE TRANSPORTES : https://apigateway.pvn.gob.pe/a/v1/AutorizacionAAM/Listar-ConfVehicular
*** DATA DESDE UNA PLACA : https://apigateway.pvn.gob.pe/ts/v1/VehicularMtc?placa=B4G993
*/
