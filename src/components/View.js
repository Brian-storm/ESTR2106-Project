import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

function View() {
  const { venueId } = useParams();
  return <h2>Single view of venueId: {venueId}</h2>;
}

export default View;