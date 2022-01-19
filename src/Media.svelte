<script>
    import VoltarMenu from './VoltarMenu.svelte'

    let nome = ""

class Alunos {
    constructor (nome, notas) {
        this.nome = nome
        this.notas = notas
    }
}

let NotasToTal = new Alunos ("", ["","","",""])

let media = 0;

function calcular () {
    media= ((NotasToTal.notas[0]+NotasToTal.notas[1]+NotasToTal.notas[2]+NotasToTal.notas[3])/4);
}

</script>

<body>
	<div>
	  <h1>Média Final</h1>
      <for>
          <div>
            <p><b>Qual seu nome?</b></p>
            <input type="text" id="nome" bind:value={nome} placeholder="Ex: Amanda Gabriela.." >
          </div>
        <label>
        <h3>SEMESTRE I</h3>
        <p>Digite notas notas da I e II unidade respectivamentes</p>
            <input name="nota01" type="number" id="nota01" bind:value={NotasToTal.notas[0]} min="0.0" max="10.0" placeholder="...">
            <input name="nota02" type="number" id="nota02" bind:value={NotasToTal.notas[1]} min="0.0" max="10.0" placeholder="...">
         </label>
        <label>
        <h3>SEMESTRE II</h3>
        <p>Digite notas notas da I e II unidade respectivamentes</p>
            <input name="nota02" type="number" id="nota02" bind:value={NotasToTal.notas[2]} min="0.0" max="10.0" placeholder="...">
            <input name="nota02" type="number" id="nota02" bind:value={NotasToTal.notas[3]} min="0.0" max="10.0"placeholder="...">
        </label>


        <div>
            <button on:click={calcular}> Resultado</button>
            <h2> {nome} Sua média final é: {media}</h2>
        </div>
        
    </for>
	</div>
</body>
<VoltarMenu/>

