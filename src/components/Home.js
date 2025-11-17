import React from 'react';

class Home extends React.Component {
  constructor() {
    super();
    this.state = { response: [] , selectedVenues: []};
  }

  componentDidMount() {
    console.log("running...")
    fetch("/api/fetchEvents")
      .then(response => response.json())
      .then(data => {
        console.log("fetched");
        console.log(data);
        this.setState({ response: data }, this.findRandomVenues);
      })
      .catch(error => {
        console.error('Error:', error);
        this.setState({ response: [] });
      });
  }

  findRandomVenues = () => {
    if (!this.state.response.length) return;

    const shuffled = [...this.state.response].sort(() => Math.random() - 0.5);  // Shuffle and take first 10
    const randomVenues = shuffled.slice(0, 10);
    this.setState({ selectedVenues: randomVenues.map(elem => elem.venueNameE) });
  }

  render() {
    return (
      <div className="container mt-4">
        <h2>Home Page</h2>
        <pre>Randomised 10 (only their English name listed): {JSON.stringify(this.state.selectedVenues, null, 2)}</pre>
        <pre>Original {JSON.stringify(this.state.response, null, 2)}</pre>
      </div>
    );
  }
}

export default Home;