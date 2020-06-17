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
    alertNotData: document.getElementById('alert-not-found-data'),
    ctnAlertNotData: document.getElementById('alert-not-found-data').parentNode,
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
        methods.validatePlate(plate);
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
          methods.validatePlate(e.target.value);
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
    getDataOfPlate: function (_plate) {
      methods.queryAxios(data.urlDataPlate + _plate, (dataOfPlate) => {
        if (dataOfPlate != null) {
          const ejes = dataOfPlate.ejes;
          // const ejes = 6;
          /**
            * Tracto
            * Tracto modular
            * Tracto remolque
            * Tracto remolque modular
           */
          const arrRender = methods.showEjes(ejes);
          let indexArr = 0;
          let count = 1;

          document.querySelectorAll(`.${data.ctnPreviewTransport} g`).forEach((elem) => {
            if (count == arrRender[indexArr]) {
              indexArr++;
            } else {
              elem.classList.add('is-hidden-eje');
            }
            count++;
          });
        }
        else
          methods.showAlert('Número de placa incorrecto o no ha sido registrado en el MTC')
      });
    },

    // Cantidad de ejes a mostrar
    validatePlate: function (_plate) {
      const regxPlate = /-/g;
      if (_plate.length > 0) {
        if (!data.typeSelected)
          methods.showAlert('Debe seleccionar un tipo');
        else {
          if (regxPlate.test(_plate)) {
            methods.showAlert('Evite ingresar caracteres especiales')
          } else {
            data.ctnAlertNotData.classList.add('is-hidden');
            methods.getDataOfPlate(_plate)
          }
        }
      }
      else {
        methods.showAlert('Ingrese un valor')
      }
    },

    // obteniendo ejes a mostrar
    showEjes: function (_ejes) {
      // Llenar array con los index de ejes que se mostrarán
      let renderEjesIndex = []
      for (let i = 0; i < _ejes; i++) {
        renderEjesIndex.push(i + 1)
      }

      return renderEjesIndex;
    },

    // Mensaje de alerta
    showAlert: function (_text) {
      data.ctnAlertNotData.classList.remove('is-hidden')
      data.alertNotData.innerText = _text;
    },
    //Mostrando inputs de placa
    showInputsPlates: function (_numOfTypes) {
      console.log(_numOfTypes)
      for(let i = 0; i < _numOfTypes; i++){
        data.ctnInputPlates[i].classList.remove('is-hidden')
      }

    },
    // Seteando valores inciales
    restart: function () {
      // Limpiando input de placa
      data.inputPlate1.value = '';

      // Ocultando warning
      data.ctnAlertNotData.classList.add('is-hidden');

      // Mostrando todos los ejes
      document.querySelectorAll('.transport-item g').forEach((elem) => {
        elem.classList.remove('is-hidden-eje');
      })
      //Ocultando todos los inputs de placa
      data.ctnInputPlates.forEach((elem) => {
        elem.classList.add('is-hidden');
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
