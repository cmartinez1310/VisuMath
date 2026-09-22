/* =========================================================
   VISUMATH
   Donde tus gestos se convierten en matemáticas
========================================================= */

let funcionActual = "";
let funcionMath = null;
let derivadaMath = null;
let segundaDerivadaMath = null;

let streamCamara = null;
let camaraActiva = false;

let manos = null;
let procesandoManos = false;
let animacionCamara = null;

let rangoGraficaActual = null;
let redibujandoGrafica = false;
let eventoGraficaRegistrado = false;
let temporizadorGrafica = null;


/* =========================================================
   ELEMENTOS HTML
========================================================= */

const funcionInput = document.getElementById("funcion");
const aceptarBtn = document.getElementById("aceptar");

const fx = document.getElementById("fx");
const fprima = document.getElementById("fprima");
const fsegunda = document.getElementById("fsegunda");

const grafica = document.getElementById("grafica");

const videoCamara = document.getElementById("videoCamara");
const dedos = document.getElementById("dedos");
const accion = document.getElementById("accion");
const resultado = document.getElementById("resultado");

const valorX = document.getElementById("valorX");
const evaluarPuntoBtn = document.getElementById("evaluarPunto");
const alertaPunto = document.getElementById("alertaPunto");
const resultadoPunto = document.getElementById("resultadoPunto");

const btnGrafica = document.getElementById("btnGrafica");
const btnCamara = document.getElementById("btnCamara");
const btnInstrucciones = document.getElementById("btnInstrucciones");
const btnReiniciar = document.getElementById("btnReiniciar");

const borrarCaracter = document.getElementById("borrarCaracter");
const borrarTodo = document.getElementById("borrarTodo");


/* =========================================================
   NORMALIZAR FUNCIÓN
========================================================= */

function normalizarFuncion(texto) {
    return texto
        .replace(/\s+/g, "")
        .replace(/²/g, "^2")
        .replace(/³/g, "^3")
        .replace(/⁴/g, "^4")
        .replace(/⁵/g, "^5")
        .replace(/√/g, "sqrt")
        .replace(/π/g, "pi")
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/ln\(/gi, "log(")
        .replace(/sen\(/gi, "sin(")
        .replace(/cot\(/gi, "cot(")
        .replace(/sec\(/gi, "sec(")
        .replace(/csc\(/gi, "csc(")
        .trim();
}


/* =========================================================
   FORMATEAR NÚMEROS
========================================================= */

function formatearNumero(numero) {

    if (typeof numero !== "number" || !Number.isFinite(numero)) {
        return "Indefinido";
    }

    if (Math.abs(numero) < 1e-10) {
        return "0";
    }

    const redondeado = Math.round(numero * 100000) / 100000;

    return String(redondeado);
}


/* =========================================================
   FUNCIONES ESPECIALES
========================================================= */

function evaluarFuncionEspecial(expr, x) {

    try {

        const expresion = expr
            .replace(/cot\(/gi, "1/tan(")
            .replace(/sec\(/gi, "1/cos(")
            .replace(/csc\(/gi, "1/sin(");

        return math.evaluate(expresion, {
            x: x
        });

    } catch (error) {
        return NaN;
    }
}


/* =========================================================
   EVALUAR FUNCIÓN
========================================================= */

function evaluarFuncion(x) {

    if (!funcionActual) {
        return NaN;
    }

    try {

        let expresion = funcionActual
            .replace(/cot\(/gi, "1/tan(")
            .replace(/sec\(/gi, "1/cos(")
            .replace(/csc\(/gi, "1/sin(");

        const valor = math.evaluate(expresion, {
            x: x
        });

        if (typeof valor !== "number") {
            return NaN;
        }

        if (!Number.isFinite(valor)) {
            return NaN;
        }

        return valor;

    } catch (error) {
        return NaN;
    }
}


/* =========================================================
   TRIGONOMETRÍA
========================================================= */

function tieneTrigonometria(texto) {

    return /sin|cos|tan|cot|sec|csc/i.test(texto);
}


function tieneAsintotas(texto) {

    return /tan|cot|sec|csc/i.test(texto);
}


/* =========================================================
   RANGO INICIAL
========================================================= */

function obtenerRangoInicial() {

    const t = funcionActual.toLowerCase();

    let xmin = -10;
    let xmax = 10;
    let ymin = -10;
    let ymax = 10;


    /* SENO */

    if (t.includes("sin") && !t.includes("cos")) {

        xmin = -Math.PI;
        xmax = Math.PI;

        ymin = -1.2;
        ymax = 1.2;
    }


    /* COSENO */

    else if (t.includes("cos") && !t.includes("sin")) {

        xmin = -2 * Math.PI;
        xmax = 2 * Math.PI;

        ymin = -1.5;
        ymax = 1.5;
    }


    /* TANGENTE */

    else if (t.includes("tan")) {

        xmin = -Math.PI;
        xmax = Math.PI;

        ymin = -6;
        ymax = 6;
    }


    /* COTANGENTE */

    else if (t.includes("cot")) {

        xmin = -Math.PI;
        xmax = Math.PI;

        ymin = -6;
        ymax = 6;
    }


    /* SECANTE / COSECANTE */

    else if (t.includes("sec") || t.includes("csc")) {

        xmin = -Math.PI;
        xmax = Math.PI;

        ymin = -6;
        ymax = 6;
    }


    /* RAÍZ */

    else if (t.includes("sqrt")) {

        xmin = 0;
        xmax = 10;

        ymin = -1;
        ymax = 5;
    }


    /* LOGARITMO */

    else if (t.includes("log")) {

        xmin = 0.05;
        xmax = 10;

        ymin = -5;
        ymax = 5;
    }


    /* EXPONENCIAL */

    else if (t.includes("e^") || t.includes("exp(")) {

        xmin = -5;
        xmax = 5;

        ymin = -2;
        ymax = 10;
    }


    rangoGraficaActual = {
        xmin,
        xmax,
        ymin,
        ymax
    };

    return rangoGraficaActual;
}


/* =========================================================
   CANTIDAD DE PUNTOS
========================================================= */

function obtenerCantidadPuntos(xmin, xmax) {

    const ancho = Math.abs(xmax - xmin);

    if (ancho > 100) return 1500;
    if (ancho > 50) return 1800;
    if (ancho > 20) return 2000;

    return 2500;
}


/* =========================================================
   GENERAR DATOS DE LA GRÁFICA
========================================================= */

function generarDatosGrafica(xmin, xmax, ymin, ymax) {

    const puntos = obtenerCantidadPuntos(xmin, xmax);

    const xs = [];
    const ys = [];

    const paso = (xmax - xmin) / (puntos - 1);

    for (let i = 0; i < puntos; i++) {

        const x = xmin + i * paso;

        let y = evaluarFuncion(x);

        if (
            !Number.isFinite(y) ||
            Number.isNaN(y) ||
            Math.abs(y) > 1000000000
        ) {
            xs.push(x);
            ys.push(null);
            continue;
        }


        /*
           Evitar líneas atravesando asíntotas
           en tan, cot, sec y csc.
        */

        if (tieneAsintotas(funcionActual)) {

            if (i > 0) {

                const anterior = ys[ys.length - 1];

                if (
                    anterior !== null &&
                    Math.abs(y - anterior) > Math.max(10, Math.abs(y) * 2)
                ) {

                    xs.push(x);
                    ys.push(null);

                    xs.push(x);
                    ys.push(y);

                    continue;
                }
            }
        }

        xs.push(x);
        ys.push(y);
    }

    return {
        xs,
        ys
    };
}


/* =========================================================
   DIBUJAR GRÁFICA
========================================================= */

function dibujarGrafica() {

    if (!grafica || !funcionActual) {
        return;
    }

    if (redibujandoGrafica) {
        return;
    }

    redibujandoGrafica = true;

    let rango = rangoGraficaActual;

    if (!rango) {
        rango = obtenerRangoInicial();
    }

    const datos = generarDatosGrafica(
        rango.xmin,
        rango.xmax,
        rango.ymin,
        rango.ymax
    );


    const traza = {
        x: datos.xs,
        y: datos.ys,
        type: "scatter",
        mode: "lines",
        line: {
            width: 3
        },
        connectgaps: false,
        hovertemplate:
            "x = %{x:.3f}<br>" +
            "f(x) = %{y:.3f}" +
            "<extra></extra>"
    };


    const layout = {

        margin: {
            l: 50,
            r: 20,
            t: 20,
            b: 45
        },

        paper_bgcolor: "rgba(0,0,0,0)",

        plot_bgcolor: "rgba(5,15,35,0.45)",

        xaxis: {

            range: [
                rango.xmin,
                rango.xmax
            ],

            zeroline: true,

            zerolinecolor: "white",

            zerolinewidth: 2,

            gridcolor: "rgba(255,255,255,0.12)",

            gridwidth: 1,

            color: "white",

            title: {
                text: "x"
            }
        },

        yaxis: {

            range: [
                rango.ymin,
                rango.ymax
            ],

            zeroline: true,

            zerolinecolor: "white",

            zerolinewidth: 2,

            gridcolor: "rgba(255,255,255,0.12)",

            gridwidth: 1,

            color: "white",

            title: {
                text: "y"
            }
        },

        showlegend: false,

        hovermode: "closest",

        uirevision: "visumath"
    };


    const config = {

        responsive: true,

        displaylogo: false,

        scrollZoom: true,

        doubleClick: "reset",

        displayModeBar: true,

        modeBarButtonsToRemove: [
            "select2d",
            "lasso2d",
            "autoScale2d"
        ],

        modeBarButtonsToAdd: []
    };


    Plotly.react(
        grafica,
        [traza],
        layout,
        config
    )
    .then(() => {

        redibujandoGrafica = false;

        registrarEventoGrafica();

    })
    .catch(() => {

        redibujandoGrafica = false;

    });
}


/* =========================================================
   EVENTO ZOOM / PAN
========================================================= */

function registrarEventoGrafica() {

    if (!grafica || eventoGraficaRegistrado) {
        return;
    }

    grafica.on(
        "plotly_relayout",
        manejarMovimientoGrafica
    );

    eventoGraficaRegistrado = true;
}


function manejarMovimientoGrafica(evento) {

    if (!evento) {
        return;
    }


    const xmin =
        evento["xaxis.range[0]"];

    const xmax =
        evento["xaxis.range[1]"];

    const ymin =
        evento["yaxis.range[0]"];

    const ymax =
        evento["yaxis.range[1]"];


    if (
        xmin !== undefined &&
        xmax !== undefined &&
        ymin !== undefined &&
        ymax !== undefined
    ) {

        rangoGraficaActual = {
            xmin,
            xmax,
            ymin,
            ymax
        };


        clearTimeout(temporizadorGrafica);


        temporizadorGrafica = setTimeout(
            () => {

                dibujarGrafica();

            },
            120
        );
    }
}


/* =========================================================
   ACEPTAR FUNCIÓN
========================================================= */

function aceptarFuncion() {

    const texto = funcionInput
        ? funcionInput.value.trim()
        : "";


    if (!texto) {

        alert("Escribe una función.");

        return;
    }


    const normalizada =
        normalizarFuncion(texto);


    try {

        funcionMath =
            math.compile(
                normalizada
            );


        const prueba =
            funcionMath.evaluate({
                x: 1
            });


        if (
            typeof prueba !== "number" &&
            typeof prueba !== "object"
        ) {
            throw new Error();
        }


        funcionActual = normalizada;


        /* DERIVADA */

        try {

            derivadaMath =
                math.derivative(
                    normalizada,
                    "x"
                );

        } catch (error) {

            derivadaMath = null;
        }


        /* SEGUNDA DERIVADA */

        try {

            if (derivadaMath) {

                segundaDerivadaMath =
                    math.derivative(
                        derivadaMath.toString(),
                        "x"
                    );

            } else {

                segundaDerivadaMath = null;

            }

        } catch (error) {

            segundaDerivadaMath = null;
        }


        /* MOSTRAR INFORMACIÓN */

        if (fx) {
            fx.textContent =
                "f(x) = " + normalizada;
        }


        if (fprima) {

            fprima.textContent =
                derivadaMath
                    ? "f′(x) = " +
                      derivadaMath.toString()
                    : "f′(x) = No disponible";
        }


        if (fsegunda) {

            fsegunda.textContent =
                segundaDerivadaMath
                    ? "f″(x) = " +
                      segundaDerivadaMath.toString()
                    : "f″(x) = No disponible";
        }


        rangoGraficaActual = null;

        dibujarGrafica();


        if (resultado) {

            resultado.textContent =
                "Función cargada correctamente.";

        }

    } catch (error) {

        alert(
            "La función no es válida. Revisa la expresión."
        );

    }
}


/* =========================================================
   TECLADO MATEMÁTICO
========================================================= */

document
    .querySelectorAll(
        ".teclado-matematico button[data-valor]"
    )
    .forEach((boton) => {

        boton.addEventListener(
            "click",
            () => {

                if (!funcionInput) {
                    return;
                }

                const valor =
                    boton.dataset.valor;

                const inicio =
                    funcionInput.selectionStart ??
                    funcionInput.value.length;

                const final =
                    funcionInput.selectionEnd ??
                    funcionInput.value.length;


                const antes =
                    funcionInput.value.slice(
                        0,
                        inicio
                    );

                const despues =
                    funcionInput.value.slice(
                        final
                    );


                funcionInput.value =
                    antes +
                    valor +
                    despues;


                const nuevaPosicion =
                    inicio + valor.length;


                funcionInput.focus();

                funcionInput.setSelectionRange(
                    nuevaPosicion,
                    nuevaPosicion
                );
            }
        );
    });


/* =========================================================
   BORRAR CARACTER
========================================================= */

if (borrarCaracter) {

    borrarCaracter.addEventListener(
        "click",
        () => {

            if (!funcionInput) {
                return;
            }


            const inicio =
                funcionInput.selectionStart;

            const final =
                funcionInput.selectionEnd;


            if (inicio !== final) {

                funcionInput.value =
                    funcionInput.value.slice(
                        0,
                        inicio
                    ) +
                    funcionInput.value.slice(
                        final
                    );

                funcionInput.setSelectionRange(
                    inicio,
                    inicio
                );

                funcionInput.focus();

                return;
            }


            if (inicio > 0) {

                funcionInput.value =
                    funcionInput.value.slice(
                        0,
                        inicio - 1
                    ) +
                    funcionInput.value.slice(
                        inicio
                    );

                funcionInput.setSelectionRange(
                    inicio - 1,
                    inicio - 1
                );
            }


            funcionInput.focus();
        }
    );
}


/* =========================================================
   BORRAR TODO
========================================================= */

if (borrarTodo) {

    borrarTodo.addEventListener(
        "click",
        () => {

            if (funcionInput) {

                funcionInput.value = "";

                funcionInput.focus();
            }
        }
    );
}


/* =========================================================
   ENTER EN FUNCIÓN
========================================================= */

if (funcionInput) {

    funcionInput.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Enter") {

                event.preventDefault();

                aceptarFuncion();
            }
        }
    );
}


/* =========================================================
   BOTÓN ACEPTAR
========================================================= */

if (aceptarBtn) {

    aceptarBtn.addEventListener(
        "click",
        aceptarFuncion
    );
}


/* =========================================================
   EVALUAR PUNTO
========================================================= */

function evaluarPunto() {

    if (!funcionActual) {

        if (alertaPunto) {

            alertaPunto.textContent =
                "Primero debes ingresar una función.";
        }

        return;
    }


    const x =
        Number(valorX.value);


    if (!Number.isFinite(x)) {

        if (alertaPunto) {

            alertaPunto.textContent =
                "Ingresa un valor válido para x.";
        }

        return;
    }


    const y =
        evaluarFuncion(x);


    if (!Number.isFinite(y)) {

        if (alertaPunto) {

            alertaPunto.textContent =
                "El punto no puede evaluarse. La función no está definida en ese valor de x.";
        }

        if (resultadoPunto) {

            resultadoPunto.textContent =
                "f(" +
                formatearNumero(x) +
                ") = Indefinido";
        }

        return;
    }


    if (alertaPunto) {
        alertaPunto.textContent = "";
    }


    if (resultadoPunto) {

        resultadoPunto.textContent =
            "f(" +
            formatearNumero(x) +
            ") = " +
            formatearNumero(y);
    }


    mostrarPuntoEnGrafica(
        x,
        y
    );
}


/* =========================================================
   MOSTRAR PUNTO EN GRÁFICA
========================================================= */

function mostrarPuntoEnGrafica(x, y) {

    if (!grafica) {
        return;
    }


    const punto = {

        x: [x],

        y: [y],

        type: "scatter",

        mode: "markers",

        marker: {

            size: 11,

            color: "#ffffff",

            line: {

                width: 2
            }
        },

        name: "Punto evaluado",

        hovertemplate:
            "x = %{x}<br>" +
            "f(x) = %{y}<extra></extra>"
    };


    Plotly.addTraces(
        grafica,
        [punto]
    );
}


if (evaluarPuntoBtn) {

    evaluarPuntoBtn.addEventListener(
        "click",
        evaluarPunto
    );
}


/* =========================================================
   GESTOS - CARGAR MEDIAPIPE
========================================================= */

function cargarMediaPipe() {

    return new Promise(
        (resolve, reject) => {

            if (window.Hands) {

                resolve();

                return;
            }


            const script =
                document.createElement("script");


            script.src =
                "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";


            script.onload =
                () => resolve();


            script.onerror =
                () => reject(
                    new Error(
                        "No se pudo cargar MediaPipe."
                    )
                );


            document.head.appendChild(
                script
            );
        }
    );
}


/* =========================================================
   INICIALIZAR MANOS
========================================================= */

async function inicializarManos() {

    try {

        await cargarMediaPipe();


        manos = new Hands({

            locateFile: (archivo) => {

                return (
                    "https://cdn.jsdelivr.net/npm/@mediapipe/hands/" +
                    archivo
                );
            }
        });


        manos.setOptions({

            maxNumHands: 1,

            modelComplexity: 1,

            minDetectionConfidence: 0.6,

            minTrackingConfidence: 0.6
        });


        manos.onResults(
            procesarResultadosMano
        );


        return true;

    } catch (error) {

        console.error(
            "Error cargando MediaPipe:",
            error
        );

        return false;
    }
}


/* =========================================================
   DISTANCIA ENTRE DOS PUNTOS
========================================================= */

function distancia(a, b) {

    const dx =
        a.x - b.x;

    const dy =
        a.y - b.y;

    return Math.sqrt(
        dx * dx +
        dy * dy
    );
}


/* =========================================================
   DETECTAR DEDO EXTENDIDO
========================================================= */

function dedoExtendido(
    landmarks,
    punta,
    intermedia,
    base
) {

    const distanciaPunta =
        distancia(
            landmarks[punta],
            landmarks[base]
        );


    const distanciaIntermedia =
        distancia(
            landmarks[intermedia],
            landmarks[base]
        );


    return (
        distanciaPunta >
        distanciaIntermedia * 1.15
    );
}


/* =========================================================
   CONTAR DEDOS
========================================================= */

function contarDedos(landmarks) {

    if (!landmarks || landmarks.length < 21) {
        return 0;
    }


    let cantidad = 0;


    /*
       ÍNDICES:
       Pulgar: 4
       Índice: 8
       Medio: 12
       Anular: 16
       Meñique: 20
    */


    /* ÍNDICE */

    if (
        dedoExtendido(
            landmarks,
            8,
            6,
            5
        )
    ) {
        cantidad++;
    }


    /* MEDIO */

    if (
        dedoExtendido(
            landmarks,
            12,
            10,
            9
        )
    ) {
        cantidad++;
    }


    /* ANULAR */

    if (
        dedoExtendido(
            landmarks,
            16,
            14,
            13
        )
    ) {
        cantidad++;
    }


    /* MEÑIQUE */

    if (
        dedoExtendido(
            landmarks,
            20,
            18,
            17
        )
    ) {
        cantidad++;
    }


    /*
       PULGAR

       Se compara la distancia de la punta
       respecto a la palma.
    */

    const pulgarPunta =
        landmarks[4];

    const pulgarBase =
        landmarks[2];

    const palma =
        landmarks[5];


    const d1 =
        distancia(
            pulgarPunta,
            palma
        );


    const d2 =
        distancia(
            pulgarBase,
            palma
        );


    if (d1 > d2 * 1.35) {

        cantidad++;
    }


    return Math.min(
        5,
        Math.max(
            0,
            cantidad
        )
    );
}


/* =========================================================
   PROCESAR RESULTADOS DE MANO
========================================================= */

function procesarResultadosMano(resultados) {

    if (!resultados) {
        return;
    }


    if (
        !resultados.multiHandLandmarks ||
        resultados.multiHandLandmarks.length === 0
    ) {

        if (dedos) {
            dedos.textContent =
                "Dedos: 0";
        }

        if (accion) {
            accion.textContent =
                "Acción: Esperando gesto...";
        }

        return;
    }


    const landmarks =
        resultados.multiHandLandmarks[0];


    const cantidad =
        contarDedos(landmarks);


    if (dedos) {

        dedos.textContent =
            "Dedos: " +
            cantidad;
    }


    ejecutarGesto(
        cantidad
    );
}


/* =========================================================
   CONTROL DE GESTOS
========================================================= */

let ultimoGesto = 0;
let tiempoUltimoGesto = 0;


function ejecutarGesto(cantidad) {

    const ahora =
        Date.now();


    /*
       Evita ejecutar continuamente
       el mismo gesto.
    */

    if (
        cantidad === ultimoGesto &&
        ahora - tiempoUltimoGesto < 1200
    ) {
        return;
    }


    ultimoGesto = cantidad;
    tiempoUltimoGesto = ahora;


    switch (cantidad) {

        case 1:

            if (accion) {

                accion.textContent =
                    "Acción: Evaluar punto";
            }

            ejecutarGestoPunto();

            break;


        case 2:

            if (accion) {

                accion.textContent =
                    "Acción: Recta tangente";
            }

            ejecutarGestoTangente();

            break;


        case 3:

            if (accion) {

                accion.textContent =
                    "Acción: Derivadas";
            }

            ejecutarGestoDerivadas();

            break;


        case 4:

            if (accion) {

                accion.textContent =
                    "Acción: Máximos y mínimos";
            }

            ejecutarGestoCriticos();

            break;


        case 5:

            if (accion) {

                accion.textContent =
                    "Acción: Reto aplicado";
            }

            ejecutarGestoReto();

            break;


        default:

            if (accion) {

                accion.textContent =
                    "Acción: Esperando gesto...";
            }

            break;
    }
}


/* =========================================================
   GESTO 1 - EVALUAR PUNTO
========================================================= */

function ejecutarGestoPunto() {

    if (!funcionActual) {

        if (resultado) {

            resultado.textContent =
                "Ingresa primero una función.";
        }

        return;
    }


    let x = 1;


    if (
        valorX &&
        valorX.value !== ""
    ) {

        const valor =
            Number(valorX.value);


        if (Number.isFinite(valor)) {

            x = valor;
        }
    }


    const y =
        evaluarFuncion(x);


    if (!Number.isFinite(y)) {

        if (resultado) {

            resultado.textContent =
                "f(" +
                formatearNumero(x) +
                ") = Indefinido";
        }

        return;
    }


    if (resultado) {

        resultado.textContent =
            "Punto: (" +
            formatearNumero(x) +
            ", " +
            formatearNumero(y) +
            ")";
    }


    if (valorX) {

        valorX.value =
            formatearNumero(x);
    }


    if (resultadoPunto) {

        resultadoPunto.textContent =
            "f(" +
            formatearNumero(x) +
            ") = " +
            formatearNumero(y);
    }


    mostrarPuntoEnGrafica(
        x,
        y
    );
}


/* =========================================================
   GESTO 2 - RECTA TANGENTE
========================================================= */

function ejecutarGestoTangente() {

    if (
        !funcionActual ||
        !derivadaMath
    ) {

        if (resultado) {

            resultado.textContent =
                "Primero ingresa una función.";
        }

        return;
    }


    let x0 = 1;


    if (
        valorX &&
        valorX.value !== ""
    ) {

        const valor =
            Number(valorX.value);


        if (Number.isFinite(valor)) {

            x0 = valor;
        }
    }


    const y0 =
        evaluarFuncion(x0);


    if (!Number.isFinite(y0)) {

        if (resultado) {

            resultado.textContent =
                "No existe la función en ese punto.";
        }

        return;
    }


    let pendiente;


    try {

        pendiente =
            derivadaMath.evaluate({
                x: x0
            });

    } catch (error) {

        pendiente = NaN;
    }


    if (!Number.isFinite(pendiente)) {

        if (resultado) {

            resultado.textContent =
                "No se pudo calcular la pendiente.";
        }

        return;
    }


    const b =
        y0 - pendiente * x0;


    if (resultado) {

        resultado.textContent =
            "Recta tangente: y = " +
            formatearNumero(pendiente) +
            "x " +
            (
                b >= 0
                    ? "+ " + formatearNumero(b)
                    : "- " + formatearNumero(Math.abs(b))
            );
    }


    dibujarTangente(
        x0,
        y0,
        pendiente
    );
}


/* =========================================================
   DIBUJAR TANGENTE
========================================================= */

function dibujarTangente(
    x0,
    y0,
    pendiente
) {

    if (!grafica) {
        return;
    }


    const rango =
        rangoGraficaActual ||
        obtenerRangoInicial();


    const x1 =
        rango.xmin;

    const x2 =
        rango.xmax;


    const y1 =
        pendiente * (x1 - x0) + y0;

    const y2 =
        pendiente * (x2 - x0) + y0;


    const linea = {

        x: [x1, x2],

        y: [y1, y2],

        type: "scatter",

        mode: "lines",

        line: {

            dash: "dash",

            width: 2
        },

        name: "Recta tangente",

        hovertemplate:
            "Recta tangente<extra></extra>"
    };


    Plotly.addTraces(
        grafica,
        [linea]
    );
}


/* =========================================================
   GESTO 3 - DERIVADAS
========================================================= */

function ejecutarGestoDerivadas() {

    if (!funcionActual) {

        if (resultado) {

            resultado.textContent =
                "Primero ingresa una función.";
        }

        return;
    }


    let texto =
        "f′(x) = " +
        (
            derivadaMath
                ? derivadaMath.toString()
                : "No disponible"
        );


    if (segundaDerivadaMath) {

        texto +=
            " | f″(x) = " +
            segundaDerivadaMath.toString();
    }


    if (resultado) {

        resultado.textContent =
            texto;
    }
}


/* =========================================================
   GESTO 4 - MÁXIMOS Y MÍNIMOS
========================================================= */

function ejecutarGestoCriticos() {

    if (
        !funcionActual ||
        !derivadaMath
    ) {

        if (resultado) {

            resultado.textContent =
                "No se pueden calcular los puntos críticos.";
        }

        return;
    }


    const rango =
        rangoGraficaActual ||
        obtenerRangoInicial();


    const puntos = [];

    const cantidad = 500;

    const paso =
        (
            rango.xmax -
            rango.xmin
        ) / cantidad;


    let anterior = null;


    for (
        let i = 0;
        i <= cantidad;
        i++
    ) {

        const x =
            rango.xmin +
            i * paso;


        let d;


        try {

            d =
                derivadaMath.evaluate({
                    x: x
                });

        } catch (error) {

            d = NaN;
        }


        if (
            !Number.isFinite(d)
        ) {

            anterior = null;

            continue;
        }


        if (
            anterior !== null &&
            Number.isFinite(anterior)
        ) {

            if (
                anterior === 0 ||
                d === 0 ||
                anterior * d < 0
            ) {

                const y =
                    evaluarFuncion(x);


                if (
                    Number.isFinite(y)
                ) {

                    puntos.push({
                        x: x,
                        y: y
                    });
                }
            }
        }


        anterior = d;
    }


    if (puntos.length === 0) {

        if (resultado) {

            resultado.textContent =
                "No se encontraron puntos críticos en el rango visible.";
        }

        return;
    }


    if (resultado) {

        resultado.textContent =
            "Puntos críticos encontrados: " +
            puntos.length;
    }


    const traza = {

        x: puntos.map(
            punto => punto.x
        ),

        y: puntos.map(
            punto => punto.y
        ),

        type: "scatter",

        mode: "markers",

        marker: {

            size: 12
        },

        name: "Puntos críticos"
    };


    Plotly.addTraces(
        grafica,
        [traza]
    );
}


/* =========================================================
   GESTO 5 - RETO APLICADO
========================================================= */

function ejecutarGestoReto() {

    if (
        !funcionActual ||
        !derivadaMath
    ) {

        if (resultado) {

            resultado.textContent =
                "Primero ingresa una función.";
        }

        return;
    }


    let x = 1;


    if (
        valorX &&
        valorX.value !== ""
    ) {

        const valor =
            Number(valorX.value);


        if (Number.isFinite(valor)) {

            x = valor;
        }
    }


    const y =
        evaluarFuncion(x);


    let velocidad;


    try {

        velocidad =
            derivadaMath.evaluate({
                x: x
            });

    } catch (error) {

        velocidad = NaN;
    }


    if (
        !Number.isFinite(y) ||
        !Number.isFinite(velocidad)
    ) {

        if (resultado) {

            resultado.textContent =
                "No se puede calcular la razón de cambio en ese punto.";
        }

        return;
    }


    if (resultado) {

        resultado.textContent =
            "Razón de cambio en x = " +
            formatearNumero(x) +
            ": " +
            formatearNumero(velocidad);
    }
}


/* =========================================================
   CÁMARA
========================================================= */

async function iniciarCamara() {

    if (camaraActiva) {
        return;
    }


    try {

        if (!navigator.mediaDevices) {

            throw new Error(
                "El navegador no permite acceder a la cámara."
            );
        }


        streamCamara =
            await navigator.mediaDevices.getUserMedia({

                video: {

                    facingMode: "user",

                    width: {
                        ideal: 640
                    },

                    height: {
                        ideal: 480
                    }
                },

                audio: false
            });


        if (videoCamara) {

            videoCamara.srcObject =
                streamCamara;

            videoCamara.setAttribute(
                "playsinline",
                ""
            );

            videoCamara.muted = true;

            await videoCamara.play();
        }


        const mediaPipeListo =
            await inicializarManos();


        if (!mediaPipeListo) {

            detenerCamara();

            if (resultado) {

                resultado.textContent =
                    "No se pudo iniciar el reconocimiento de gestos.";
            }

            return;
        }


        camaraActiva = true;


        if (btnCamara) {

            btnCamara.textContent =
                "Detener cámara";
        }


        if (accion) {

            accion.textContent =
                "Acción: Esperando gesto...";
        }


        iniciarReconocimientoCamara();

    } catch (error) {

        console.error(
            "Error con la cámara:",
            error
        );


        if (resultado) {

            resultado.textContent =
                "No se pudo acceder a la cámara. Verifica los permisos del navegador.";
        }
    }
}


/* =========================================================
   RECONOCIMIENTO CONTINUO
========================================================= */

async function procesarFrameCamara() {

    if (
        !camaraActiva ||
        !manos ||
        !videoCamara
    ) {
        return;
    }


    if (
        videoCamara.readyState >= 2 &&
        !procesandoManos
    ) {

        procesandoManos = true;


        try {

            await manos.send({
                image: videoCamara
            });

        } catch (error) {

            console.error(
                "Error procesando mano:",
                error
            );
        }


        procesandoManos = false;
    }


    if (camaraActiva) {

        animacionCamara =
            requestAnimationFrame(
                procesarFrameCamara
            );
    }
}


function iniciarReconocimientoCamara() {

    if (animacionCamara) {

        cancelAnimationFrame(
            animacionCamara
        );
    }


    procesarFrameCamara();
}


/* =========================================================
   DETENER CÁMARA
========================================================= */

function detenerCamara() {

    camaraActiva = false;

    procesandoManos = false;


    if (animacionCamara) {

        cancelAnimationFrame(
            animacionCamara
        );

        animacionCamara = null;
    }


    if (streamCamara) {

        streamCamara
            .getTracks()
            .forEach(
                track => track.stop()
            );

        streamCamara = null;
    }


    if (videoCamara) {

        videoCamara.srcObject = null;
    }


    if (btnCamara) {

        btnCamara.textContent =
            "Activar cámara";
    }


    if (dedos) {

        dedos.textContent =
            "Dedos: 0";
    }


    if (accion) {

        accion.textContent =
            "Acción: Esperando gesto...";
    }
}


/* =========================================================
   BOTÓN CÁMARA
========================================================= */

if (btnCamara) {

    btnCamara.addEventListener(
        "click",
        () => {

            if (!camaraActiva) {

                iniciarCamara();

            } else {

                detenerCamara();
            }
        }
    );
}


/* =========================================================
   BOTÓN GRÁFICA
========================================================= */

if (btnGrafica) {

    btnGrafica.addEventListener(
        "click",
        () => {

            if (grafica) {

                grafica.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }
        }
    );
}


/* =========================================================
   INSTRUCCIONES
========================================================= */

if (btnInstrucciones) {

    btnInstrucciones.addEventListener(
        "click",
        () => {

            alert(
                "VISUMATH\n\n" +
                "1 dedo → Evaluar punto\n" +
                "2 dedos → Recta tangente\n" +
                "3 dedos → Derivadas\n" +
                "4 dedos → Máximos y mínimos\n" +
                "5 dedos → Reto aplicado / razón de cambio"
            );
        }
    );
}


/* =========================================================
   REINICIAR
========================================================= */

if (btnReiniciar) {

    btnReiniciar.addEventListener(
        "click",
        () => {

            funcionActual = "";

            funcionMath = null;

            derivadaMath = null;

            segundaDerivadaMath = null;

            rangoGraficaActual = null;


            if (funcionInput) {

                funcionInput.value = "";
            }


            if (fx) {

                fx.textContent =
                    "f(x) = —";
            }


            if (fprima) {

                fprima.textContent =
                    "f′(x) = —";
            }


            if (fsegunda) {

                fsegunda.textContent =
                    "f″(x) = —";
            }


            if (valorX) {

                valorX.value = "";
            }


            if (alertaPunto) {

                alertaPunto.textContent = "";
            }


            if (resultadoPunto) {

                resultadoPunto.textContent = "";
            }


            if (resultado) {

                resultado.textContent =
                    "Esperando función...";
            }


            detenerCamara();


            if (grafica) {

                Plotly.purge(grafica);

                eventoGraficaRegistrado = false;
            }
        }
    );
}


/* =========================================================
   REDIMENSIONAR GRÁFICA
========================================================= */

window.addEventListener(
    "resize",
    () => {

        if (grafica) {

            Plotly.Plots.resize(
                grafica
            );
        }
    }
);


/* =========================================================
   INICIO
========================================================= */

if (resultado) {

    resultado.textContent =
        "Esperando función...";
}

console.log(
    "VISUMATH iniciado correctamente."
);