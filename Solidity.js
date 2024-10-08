//SPDX-License-Identifier: MIT
//Definindo a versão na qual iremos trabalhar
pragma solidity 0.8.26;

struct Bet {
    uint amount;
    uint candidate;
    uint timestamp;
    uint claimed;
}

struct Dispute {
    string candidate1;
    string candidate2;
    string image1;
    string image2;
    uint total1;
    uint total2;
    uint winner;

}

//Definindo o contrato
contract BetCandidate {
    
    //As informações que estão dentro do contrato por padrão elas são restritas ao usuário,
    //Mas se quizermos deixa-lás públicas adicionamos o comando "public" depois do tipo de dado.
    //Ex:. "Dispute public dispute".
    Dispute public dispute;

    //O "mapping" ele é um tipo de dado baseado em chave/valor
    //Estamos utilizando o endereço de carteira do usuário como a chave do mapping
    //Para associar a informação da carteira com a aposta usamos uma flexa e a variável
    //Utilizamos o modificador "public" para conseguirmos pegar essas informações
    mapping(address => Bet) public allBets;

    //Criando uma variável do tipo address que é específica para armazenar carteiras
    address owner;
    //Variável do tipo inteiro porem sempre maior que 0. uint = sem sinal
    uint fee = 1000;//10%

    //Definindo variável para premio liquido
    uint public netPrize;

    constructor(){
        //A variável vai receber uma massage de alguem que disparou sender
        //Toda chamada de função global exige um objeto global chamado massage ou "msg"
        owner = msg.sender;
        //Declarando dispute
        dispute = Dispute ({
            candidate1: "Donald Trump",
            candidate2: "Kamala Harris",
            image1: "https://images.app.goo.gl/3gz7njhHbPLJzUsW6",
            image2: "https://images.app.goo.gl/iBHVucu5avdsDeMw5",
            total1: 0,
            total2: 0,
            winner: 0
        });
    }

    //Para quer o frontend consiga acessar essa funcionalidade definimos ela como "external"
    //Como está é uma fução em que estaremos enviando uma quantia na transação inserimos o "payable" para dizer que será realizado junto a função um pagamento
    function bet (uint candidate) external payable {
        //Função nativa do solidity para realizar validações
        //Primeiros adicionamos a condição de sucesso para depois o caso de falha
        require(candidate == 1 || candidate == 2, "Invalid candidate");//Checando se a aposta foi realizado no candidato 1 ou 2
        require(msg.value > 0, "Invalid bet");//Checando se a aposta que foi realizada é maior que 0
        require(dispute.winner == 0, "Dispute Closed");

        //Quando utilizamos uma estrutura no solidity e adicionamos um "memory" estamos indicando que o objeto é temporário mas que depois salvaremos isso na memória
        //Isto é valido para estruturas mais complexas como arrays e structures
        Bet memory newBet;
        newBet.amount = msg.value;
        newBet.candidate = candidate;
        //Outro objeto global disponível para utilizarmos é o "block"
        //A blockchain ela salva as coisas em bloco, e uma das informações importantes que temos é o tempo em que esse bloco foi salvo
        newBet.timestamp = block.timestamp;

        //
        allBets[msg.sender] = newBet;

        if(candidate == 1){
            dispute.total1 += msg.value;
        }
        else{
            dispute.total2 += msg.value;
        }

    }

    //Criando uma finção extaerna para encerrar as apostas
    function finish(uint winner) external{
        //msg.sender pega o endereço de quem está executando a função
        require(msg.sender == owner, "Incalid account");
        require(winner == 1 || winner == 2, "Invalid candidate");
        require(dispute.winner == 0, "Dispute closed");

        dispute.winner = winner;

        uint grossPrize = dispute.total1 + dispute.total2;
        uint commission = (grossPrize * fee) / 1e4;
        netPrize = grossPrize - commission;

        payable(owner).transfer(commission);

    }

    //Função para reclamar sua aposta ganha
    function claim() external {
        //Toda vez que usamos estruturas complexas usamos um 'memory' junto
        Bet memory userBet = allBets[msg.sender];
        require(dispute.winner > 0 && dispute.winner == userBet.candidate && userBet.claimed == 0, "Invalid claim");

        uint winnerAmout = dispute.winner == 1 ? dispute.total1 : dispute.total2;
        uint ratio = (userBet.amount * 1e4) / winnerAmout;
        uint individualPrize = netPrize * ratio / 1e4;
        allBets[msg.sender]. claimed = individualPrize;
        payable (msg.sender).transfer(individualPrize);
    }

}


/////////////////////Observações
//-> Para que seja disponibilizado algum dado para ser visto até no front end devemos setar como público ex.: public contract Xyz