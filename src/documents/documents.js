import deklaraciqImg from "./deklaraciqq.jpeg";
import changeImg from "./change.jpeg";
import iskaneImg from "./iskane.jpeg";
import obshtoImg from "./obshto-subranie.jpeg";
import zakonImg from "./zakon.jpeg";
import pravilnikImg from "./pravilnik.png"


const documents = [
  {
    id: 1,
    title: "Декларация за притежаване на куче",
    img: deklaraciqImg,
    link: "/documents/dog.pdf"
  },
  {
    id: 2,
    title: "Заявление за промяна в обстоятелствата",
    img: changeImg,
    link: "/documents/change.pdf"
  },
  {
    id: 3,
    title: "Искане на собствениците на 20% идеални части от общите части за свикване на Общо събрание",
    img: iskaneImg,
    link: "/documents/iskane.pdf"
  },
  {
    id: 4,
    title: "Пълномощно за общо събрание",
    img: obshtoImg,
    link: "/documents/obshto-subranie.pdf"
  },
  {
    id: 5,
    title: "Закон за управление на етажната собственост",
    img: zakonImg,
    link: "/documents/zakon.pdf"
  },
  {
    id: 6,
    title: "Правилник за вътрешния ред",
    img: pravilnikImg,
    link: "/documents/pravilnik.doc"
  }
];

export default documents;
