# Criando Produtores e Consumidores

Imaginemos que tenhamos a seguinte situação, uma aplicação A1 que é a aplicação
de um ecommerce e temos uma aplicação A2 que é um serviço de email. Dessa forma,
sempre que uma transação ocorrer na aplicação A1, ela irá produzir uma mensagem
para um tópico que será então consumido pela aplicação A2, que irá enviar um
email indicandi que a compra foi realizada com sucesso.

Primeiro, é preciso que você faça download do kafka: [aqui](https://kafka.apache.org/downloads)
Baixe os arquivos que indicam "binary download", após baixar só precisar extrair
a página, vamos utilizar os arquivos que estão dentro da pasta `bin`.

O Kafka é uma plataforma distribuida, dessa forma, a ideia é termos diversos
brokers (instâncias) do kafka rodando, com isso é necessário que uma outra
aplicação fique responsável pela "descoberta" dessas instâncias. Para isso temos
o Zookeeper, que é o coordenador dos brokers. Ele será o primeiro camarada que
que vamos executar, com o seguinte comando, abra o terminal na pasta do kafka
que extraiu e digite:

```sh
./bin/zookeeper-server-start.sh config/zookeeper.properties
```

Note que passamos um arquivo de configuração, ele vai determinar algumas valores
para funcionamento do zookeeper, para quem já trabalhou com java ele é similar a
um application.properties.

Após execução do zookeeper, podemos iniciar um broker do kafka, é importante
notar que é necessário primeiro o zookeeper, o broker irá dar erro ao perceber
que não possui um zookeeper sendo executado. Abra uma nova aba do terminal e
execute o seguinte comando:

```sh
./bin/kafka-server-start.sh config/server.properties
```

Pronto, agora temos o nosso zookeper e 1 broker em execução, agora podemos criar
um topico, que será onde as mensagens ficarão armazenadas e serão consumidas. O
tópico receberá mensagens de um produto e terá as mensagens processadas por um
consumidor devidamente "inscrito" ao tópico. Para criar um tópico, execute:

```sh
./bin/kafka-topics.sh --create --topic payments --bootstrap-server localhost:9092
```

Após a criação de um tópico, e perceba que criamos ele da maneira mais simples,
ou seja, não especificamos uma partição, dessa forma ele vem com um valor
default (1), também não explicitamos o replication factor, dessa forma os
tópicos não serão replicados entre os brokers, todas as essas configurações
podem ser alteradas depois.

Agora vamos criar um produtor, que será nossa aplicação A1, digite o seguinte:

```sh
./bin/kafka-console-producer.sh --topic payments --bootstrap-server localhost:9092
```

Certo, agora podemos começar a produzir mensagens para nosso tópico, por exemplo
digite a seguinte mensagem, escolhemos o formato de separação por virgula na
nossa mensagem:

```sh
john@gmail.com,Xbox Series X,1,2021-09-10
```

Nossa mensagem possui o email, que será usado pela aplicação A2, o nome do item,
a quantidade e por fim a data da transação. Agora, vamos criar um consumidor
para realizar o processamento da mensagem, o consumidor será nossa aplicação A2.

```
./bin/kafka-console-consumer.sh --topic payments --from-beginning --group \
notification --bootstrap-server localhost:9092
```

No inicio indicamos de qual topico queremos consumidr, depois indicamos que
queremos receber todas as mensagens que o tópico já recebeu (lembrando que o
kafka mantém as mensagens armazenadas mesmo após processadas por consumidores,
existe um tempo padrão de 7 dias, tempo que se encontra dentro do arquivo
server.properties), com isso, mesmo a mensagem tendo sido produzida antes do
consumidor se conectar ao tópico, ele irá receber a mensagem.

Depois passamos um `--group`, que é o consumer groups que aquele consumidor vai
fazer parte, como estamos utilizando o terminal, por padrão o kafka colocaria os
consumidores em um grupo especifico de console, mas já estamos dividindo aqui,
dessa forma, estamos indicando que nosso consumidor pertence ao grupo de
notificações. Depois indicamos o broker do kafka.

Pronto, agora temos um produtor, nossa aplicação de pagamentos, produzindo
mensagens e um consumidor inicial que está consumindo essas mensagens, nossa
aplicação de envio de emails. Agora imagine que você, além de enviar um email
indicando que a compra foi realizada, deseja ter uma aplicação A3 que será uma
aplicação de recomendação, ou seja, teremos algum tipo de trabalho de modelagem
com base em compras antigas, para isso precisamos também consumir o tópico de
payments. Execute então, o seguinte comando:

```sh
./bin/kafka-console-consumer.sh --topic payments --from-beginning --group \
recommendation --bootstrap-server localhost:9092
```

Agora, imagine que, você é um ecommerce que realiza muitas transações por
minuto, gerando uma quantida de de mensagens gigantescas, o que pode gerar um
atraso no envio dos emails. Para melhorar isso você decide criar uma nova
instancia de sua aplicação de A2, execute novamente o comando:

```
./bin/kafka-console-consumer.sh --topic payments --from-beginning --group \
notification --bootstrap-server localhost:9092
```

Perceba que esse consumer faz parte do mesmo grupo da aplicação A2, imaginemos
que ele é na verdade a mesma aplicação, apenas uma instância diferente, outro
detalhe que dá pra perceber é que, mesmo com a flag `--from-beginning`, ainda
assim nossa nova instância de A2 não recebeu as mensagens, isso se dá ao fato da
outra instância já ter processada as mensagens, o kafka controla com base no
consumer group, ou seja, se a mensagem já foi entregue para o grupo ele não será
reentregue, o que faz sentido, caso contrário enviriamos o email de confirmação
duas vezes. Agora produza mais 2 mensagens:

```sh
can@gmail.com,Iphone 5,1,2021-12-10
nina@gmail.com,Fone de ouvido,1,2021-11-10
ju@gmail.com, O Aprendiz de Assassino, 1, 2021-11-12
dan@gmail.com, Teclado, 1, 2021-07-12
```

Deu pra perceber que todas as quatro menagem produzidas foi entregue a apenas um
dos consumidores do grupo de notification, certo? bom, isso se dá as partições,
como nosso tópico possui apenas uma, um dos consumidores ficará ocioso, ele
receberá mensagens caso o outro consumidor do grupo deixe de funcionar. Para
termos uma distribuição de mensagens, podemos alterar nosso tópico para ter 2
partições, com isso cada consumidor ficará responsável por uma. Execute o
seguinte comando:

```sh
./bin/kafka-topics.sh --alter --partitions 2 --topic payments --bootstrap-server \
localhost:9092
```

Agora iremos perceber que as mensagens produzidas serão entregues de maneira
alternada entre os consumidores, quando entregue para um não será entregue para
outro, vale também notar que nossa aplicação A3, serviço de recomendação,
continuará recebendo todas as mensagens normalmente tendo em vista que possui
apenas uma instância.

E é isso, em termos de conceito, usando os arquivos binarios oferecidos pelo
proprio kafka dá para brincar bastante, agora basta trocar os binarios por uma
aplicação desenvolvida pela sua linguagem de preferência.
